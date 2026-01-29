import supabase from '../config/supabase.js';
import axios from 'axios';

// --- Types ---
interface FlowContext {
  [key: string]: any;
}

interface WebhookPayload {
  type: 'message' | 'button_reply' | 'list_reply' | 'status' | 'media';
  from: string; // Phone number
  text?: string;
  payload?: string; // Button ID or List ID
  media?: any;
  messageId?: string;
  status?: string; // sent, delivered, read
}

interface Node {
  id: string;
  type: string;
  properties: any;
  connections: Connection[];
}

interface Connection {
  targetNodeId: string;
  condition?: string; // For branching
  sourceHandle?: string; // For branching (true/false)
}

// --- Engine ---

export const FlowEngine = {
  /**
   * Main Entry Point for Webhooks
   */
  async handleIncomingEvent(payload: WebhookPayload) {
    const { from: phoneNumber, type } = payload;
    console.log(`[FlowEngine] Event from ${phoneNumber}: ${type}`);

    // 1. Handle Status Updates (Delivery/Read) separately
    if (type === 'status') {
      await this.handleStatusUpdate(payload);
      return;
    }

    // 2. Find Active Session
    let session = await this.getSession(phoneNumber);

    // 3. Logic: New Flow vs Continue Flow
    if (!session) {
      // No active session. Check for Start Triggers (Keywords)
      if (type === 'message' && payload.text) {
        await this.checkStartTriggers(phoneNumber, payload.text);
      }
    } else {
      // Active Session. Process Input for Current Node
      await this.processCurrentNodeInput(session, payload);
    }
  },

  async handleStatusUpdate(payload: WebhookPayload) {
    if (!payload.messageId || !payload.status) return;
    
    // Update message logs
    await supabase
      .from('message_logs')
      .update({ status: payload.status })
      .eq('wati_message_id', payload.messageId);
      
    // TODO: Update Analytics for 'read' count if needed
  },

  async getSession(phoneNumber: string) {
    const { data } = await supabase
      .from('contact_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('status', 'active')
      .single();
    return data;
  },

  async checkStartTriggers(phoneNumber: string, text: string) {
    const cleanText = text.trim().toLowerCase();

    // Find flow with matching keyword trigger
    const { data: flows } = await supabase
      .from('flows')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'keyword');

    if (!flows) return;

    const matchedFlow = flows.find(f => 
      f.trigger_value && f.trigger_value.toLowerCase() === cleanText
    );

    if (matchedFlow) {
      console.log(`[FlowEngine] Triggering Flow: ${matchedFlow.name}`);
      await this.startFlow(phoneNumber, matchedFlow.id);
    }
  },

  async startFlow(phoneNumber: string, flowId: string) {
    // 1. Get or Create Contact
    let { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

    if (!contact) {
        const { data: newContact } = await supabase
            .from('contacts')
            .insert({ phone_number: phoneNumber })
            .select('id')
            .single();
        contact = newContact;
    }

    // 2. Fetch Flow Nodes
    const { data: nodes } = await supabase
        .from('nodes')
        .select('*')
        .eq('flow_id', flowId);

    if (!nodes || nodes.length === 0) return;

    // 3. Find Start Node (or first node)
    // In our builder, we have a 'start' node. We need to find what it connects to.
    const startNode = nodes.find(n => n.type === 'start');
    let firstRealNodeId: string | null = null;

    if (startNode && startNode.connections && startNode.connections.length > 0) {
        firstRealNodeId = startNode.connections[0].targetNodeId;
    } else {
        // Fallback: just take the first non-start node? Or fail.
        return; 
    }

    if (!firstRealNodeId) return;

    // 4. Create Session
    const { data: session } = await supabase
        .from('contact_sessions')
        .insert({
            contact_id: contact?.id,
            phone_number: phoneNumber,
            flow_id: flowId,
            current_node_id: firstRealNodeId,
            status: 'active',
            context: {}
        })
        .select('*')
        .single();

    // 5. Execute First Node
    await this.executeNode(session, firstRealNodeId, nodes);
  },

  async processCurrentNodeInput(session: any, payload: WebhookPayload) {
    // Fetch all nodes for context (optimization: cache this or fetch only needed)
    const { data: nodes } = await supabase
        .from('nodes')
        .select('*')
        .eq('flow_id', session.flow_id);

    if (!nodes) return;

    const currentNode = nodes.find(n => n.id === session.current_node_id);
    if (!currentNode) {
        // Node not found, maybe flow changed. End session.
        await this.endSession(session.id);
        return;
    }

    // Check if current node expects input
    // Only 'input' nodes wait for user input. 'message' nodes usually auto-advance unless they have buttons?
    // Actually, usually we execute a node (send msg) and THEN wait if it's an input node.
    // If it was a message node, we likely already executed it and moved to next?
    // Wait, if we are in 'active' state at a node, it means we are WAITING at that node.
    
    // Strategy: 
    // - If current node is 'input', validation input.
    // - If current node is 'message' with buttons, validate button reply.
    // - Else, maybe we shouldn't be waiting there? 
    //   (Actually, simple flow engines often "pause" at Input nodes. 
    //    For Message nodes, they send and immediately move next. 
    //    So session.current_node_id should point to the node we are WAITING for.)

    let nextNodeId: string | null = null;
    let variableUpdate: any = {};

    if (currentNode.type === 'input') {
        // Handle User Input
        const variableName = currentNode.properties.variableName;
        const inputType = currentNode.properties.inputType || 'text';

        let capturedValue = null;
        if (inputType === 'text' && payload.text) capturedValue = payload.text;
        else if (inputType === 'number' && payload.text && !isNaN(Number(payload.text))) capturedValue = Number(payload.text);
        // ... other types

        if (capturedValue !== null) {
            if (variableName) {
                variableUpdate[variableName] = capturedValue;
            }
            // Move to next node (default connection)
            if (currentNode.connections && currentNode.connections.length > 0) {
                nextNodeId = currentNode.connections[0].targetNodeId;
            }
        } else {
            // Invalid input. Maybe retry?
            await this.sendMessage(session.phone_number, "Invalid input. Please try again.");
            return; 
        }

    } else if (currentNode.type === 'message' || currentNode.type === 'button' || currentNode.type === 'list') {
        // If it's a button/list message, we expect a specific payload or text
        if (payload.type === 'button_reply' || payload.type === 'list_reply') {
            // Find connection matching payload? 
            // In our simple builder, we might just map buttons to connections.
            // But currently our connections array just lists targets. 
            // We need to know WHICH button leads to WHICH node.
            // Assumption: Node properties has `buttons` array. Connections array aligns with it?
            // Or we check payload.
        }
        
        // For now, auto-advance if it's just text message (but we wouldn't be waiting there).
        // Assuming we only wait at Input nodes for now for simplicity, OR button nodes.
        
        // Let's assume generic "Any Input" advances for now if not strictly defined
        if (currentNode.connections && currentNode.connections.length > 0) {
             nextNodeId = currentNode.connections[0].targetNodeId;
        }
    }

    // Update Context if needed
    if (Object.keys(variableUpdate).length > 0) {
        const newContext = { ...session.context, ...variableUpdate };
        await supabase
            .from('contact_sessions')
            .update({ context: newContext })
            .eq('id', session.id);
            
        // Also update Contact attributes
        await supabase
            .from('contacts')
            .update({ attributes: newContext }) // Merging logic needed in real DB, JSONB matches merge by default in updates? No, replaces.
            // For now, simple replace or we need a specific update function.
            // We'll skip contact update for safety or do a read-update.
            .eq('phone_number', session.phone_number);
    }

    if (nextNodeId) {
        await this.advanceToNode(session, nextNodeId, nodes);
    } else {
        await this.endSession(session.id);
    }
  },

  async executeNode(session: any, nodeId: string, allNodes: any[]) {
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) {
        await this.endSession(session.id);
        return;
    }

    // Update Session to Current Node
    await supabase
        .from('contact_sessions')
        .update({ current_node_id: nodeId, last_interaction_at: new Date() })
        .eq('id', session.id);

    // LOG ANALYTICS: Entry
    await this.logAnalytics(session.flow_id, nodeId, 'entry');

    // EXECUTE ACTIONS based on Node Type
    try {
        switch (node.type) {
            case 'message':
            case 'button':
            case 'list':
                await this.sendMessage(session.phone_number, node.properties);
                
                // If message has NO buttons/interactive elements, we auto-advance
                // If it HAS buttons, we STOP and wait for input (Session stays at this node)
                const hasInteractive = node.properties.buttons && node.properties.buttons.length > 0;
                if (!hasInteractive) {
                     await this.advanceToDefaultNext(session, node, allNodes);
                }
                break;

            case 'input':
                await this.sendMessage(session.phone_number, { label: node.properties.label });
                // STOP and wait for input
                break;

            case 'condition':
                // Evaluate Condition
                // Assuming simple True/False based on context variable
                // This is complex, implementing simple random split or "True" for now
                const result = true; // Placeholder logic
                const handle = result ? 'true' : 'false';
                // Find connection for handle
                // Our builder used "sourceHandle" for branching?
                // We need to look at connections.
                // For now, just take first connection
                await this.advanceToDefaultNext(session, node, allNodes);
                break;

            case 'delay':
                // In a real system, we'd schedule a job. 
                // Here we might just sleep (bad for serverless) or ignore.
                // Auto-advance
                await this.advanceToDefaultNext(session, node, allNodes);
                break;
                
            case 'tag':
                const { action, tags } = node.properties;
                // Logic to update tags in DB...
                await this.advanceToDefaultNext(session, node, allNodes);
                break;
                
            case 'webhook':
                // Fire and forget (or await)
                try {
                    const { url, method } = node.properties;
                    if (url) {
                        await axios({ method: method || 'POST', url, data: session.context });
                    }
                } catch (e) { console.error("Webhook failed", e); }
                await this.advanceToDefaultNext(session, node, allNodes);
                break;
                
            case 'handoff':
                await this.endSession(session.id, 'paused');
                // Notify agent...
                break;

            case 'note':
                // Internal only, skip
                await this.advanceToDefaultNext(session, node, allNodes);
                break;

            default:
                await this.advanceToDefaultNext(session, node, allNodes);
        }
    } catch (err) {
        console.error("Error executing node", err);
    }
  },

  async advanceToDefaultNext(session: any, currentNode: any, allNodes: any[]) {
      if (currentNode.connections && currentNode.connections.length > 0) {
          const nextId = currentNode.connections[0].targetNodeId;
          // Recursively execute next node
          // Note: In Node.js, stack depth limit applies. For long flows, use loop or queue.
          // For MVP, recursion is okay for short chains.
          await this.executeNode(session, nextId, allNodes);
      } else {
          // End of Flow
          await this.endSession(session.id);
      }
  },

  async advanceToNode(session: any, nextNodeId: string, allNodes: any[]) {
      await this.executeNode(session, nextNodeId, allNodes);
  },

  async endSession(sessionId: string, status = 'completed') {
      await supabase
        .from('contact_sessions')
        .update({ status })
        .eq('id', sessionId);
  },

  async sendMessage(to: string, content: any) {
    console.log(`[FlowEngine] Sending Message To: ${to}`);

    // 1. Get Config
    const { data: config } = await supabase
      .from('api_config')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!config || !config.api_key || !config.business_number_id) {
        console.error('[FlowEngine] Missing API Config (Token or Phone ID)');
        return;
    }

    const version = 'v17.0'; // Or from config.base_url
    const url = `https://graph.facebook.com/${version}/${config.business_number_id}/messages`;
    
    // 2. Construct Payload
    let payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
    };

    if (content.buttons && content.buttons.length > 0) {
        // Interactive Message (Buttons)
        payload.type = 'interactive';
        payload.interactive = {
            type: 'button',
            body: { text: content.label || 'Please select an option:' },
            action: {
                buttons: content.buttons.map((btn: any, idx: number) => ({
                    type: 'reply',
                    reply: {
                        id: `btn_${idx}`, // We might need better IDs mapping to node logic
                        title: btn.text.substring(0, 20) // Limit 20 chars
                    }
                }))
            }
        };
        // Add Header if mediaType exists
        if (content.mediaType === 'image' || content.mediaType === 'video' || content.mediaType === 'document') {
             // For now, simpler text header or skip
             // Complex media handling requires uploading media ID first usually
        }

    } else if (content.label) {
        // Simple Text
        payload.type = 'text';
        payload.text = { body: content.label };
    } else {
        // Fallback
        return;
    }

    // 3. Send Request
    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${config.api_key}`,
                'Content-Type': 'application/json'
            }
        });
        
        const waMessageId = response.data.messages?.[0]?.id;
        
        // 4. Log
        await supabase.from('message_logs').insert({
            phone_number: to,
            message_type: payload.type,
            content: content,
            status: 'sent',
            wati_message_id: waMessageId, // Using this column for WA ID now
        });

    } catch (error: any) {
        console.error('[FlowEngine] Send Error:', error.response?.data || error.message);
        await supabase.from('message_logs').insert({
            phone_number: to,
            message_type: 'error',
            content: { error: error.message },
            status: 'failed',
        });
    }
  },
  
  async logAnalytics(flowId: string, nodeId: string, type: 'entry' | 'exit' | 'drop_off') {
      // Upsert analytics
      // ...
  }
};
