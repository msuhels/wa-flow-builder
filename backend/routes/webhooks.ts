import { Router, type Request, type Response } from 'express';
import { FlowEngine } from '../services/flowEngine.js';

const router = Router();

/**
 * Incoming Webhook for WhatsApp Cloud API
 * POST /api/webhooks/whatsapp
 */
router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    
    // 1. Verification Challenge (GET request usually, but sometimes POST with body?)
    // Actually, verification is usually a GET request handled separately.
    // We should add a GET handler for verification.
    
    // 2. Event Processing
    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            const from = body.entry[0].changes[0].value.messages[0].from; // sender phone number
            const msg_body = body.entry[0].changes[0].value.messages[0].text?.body;
            const type = body.entry[0].changes[0].value.messages[0].type;
            const messageId = body.entry[0].changes[0].value.messages[0].id;

            const normalizedEvent: any = {
                type: 'message',
                from: from,
                messageId: messageId,
                text: msg_body
            };

            // Handle Interactive (Buttons/Lists)
            if (type === 'interactive') {
                const interactive = body.entry[0].changes[0].value.messages[0].interactive;
                if (interactive.type === 'button_reply') {
                    normalizedEvent.type = 'button_reply';
                    normalizedEvent.payload = interactive.button_reply.id;
                    normalizedEvent.text = interactive.button_reply.title;
                } else if (interactive.type === 'list_reply') {
                    normalizedEvent.type = 'list_reply';
                    normalizedEvent.payload = interactive.list_reply.id;
                    normalizedEvent.text = interactive.list_reply.title;
                }
            }

            // Async processing
            FlowEngine.handleIncomingEvent(normalizedEvent).catch(err => {
                console.error("Error processing webhook event:", err);
            });
            
            res.sendStatus(200);
        } else if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0] &&
            body.entry[0].changes[0].value.statuses
        ) {
             // Handle Statuses
             const status = body.entry[0].changes[0].value.statuses[0];
             const normalizedEvent: any = {
                 type: 'status',
                 from: status.recipient_id,
                 messageId: status.id,
                 status: status.status
             };
             
             FlowEngine.handleIncomingEvent(normalizedEvent).catch(err => {
                console.error("Error processing status event:", err);
            });
             res.sendStatus(200);
        } else {
            // Unknown event structure or unrelated event
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * Webhook Verification (GET)
 */
router.get('/whatsapp', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check with ENV or DB config?
    // For now, accepting any token or a fixed one "trae_whatsapp_verify"
    // In production, fetch from DB api_config if needed, or ENV.
    const VERIFY_TOKEN = "123456";

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

export default router;
