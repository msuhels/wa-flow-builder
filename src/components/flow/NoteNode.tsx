import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { StickyNote } from 'lucide-react';

const NoteNode = ({ data }: NodeProps) => {
  const { label } = data as any;

  return (
    <div className="bg-yellow-100 rounded-lg border border-yellow-300 shadow-sm min-w-[180px] max-w-[250px]">
      <div className="p-2 border-b border-yellow-200 flex items-center text-xs font-semibold text-yellow-800">
        <StickyNote className="w-3 h-3 mr-1" />
        Internal Note
      </div>
      <div className="p-3 text-sm text-gray-700 italic font-handwriting">
        {label || 'Add a note for your team...'}
      </div>
      {/* Notes typically don't affect flow, but purely visual. No handles needed usually, or strictly for annotation. */}
    </div>
  );
};

export default memo(NoteNode);
