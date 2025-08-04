import { useState, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface BulletTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function BulletTextarea({
  value,
  onChange,
  placeholder = "Escriba aquí. Presione Enter para crear bullets automáticamente...",
  rows = 5,
  className,
  onBlur,
  onFocus
}: BulletTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const textAfterCursor = value.substring(cursorPosition);
      
      // Check if we're at the end of a line or if the line is empty
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // If current line is empty or just whitespace, add a bullet
      if (currentLine.trim() === '') {
        const newValue = textBeforeCursor + '• ' + textAfterCursor;
        onChange(newValue);
        
        // Set cursor position after the bullet
        setTimeout(() => {
          const newCursorPosition = cursorPosition + 2; // After "• "
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
        return;
      }
      
      // If current line doesn't start with a bullet, add one for the new line
      if (!currentLine.trim().startsWith('•') && !currentLine.trim().startsWith('-')) {
        const newValue = textBeforeCursor + '\n• ' + textAfterCursor;
        onChange(newValue);
        
        setTimeout(() => {
          const newCursorPosition = cursorPosition + 3; // After "\n• "
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
        return;
      }
      
      // If current line already has a bullet, add another bullet on new line
      const newValue = textBeforeCursor + '\n• ' + textAfterCursor;
      onChange(newValue);
      
      setTimeout(() => {
        const newCursorPosition = cursorPosition + 3; // After "\n• "
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
    
    // Handle backspace on empty bullet lines
    if (e.key === 'Backspace') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // If we're at the start of a bullet line with just "• ", remove the bullet
      if (currentLine === '• ' && textarea.selectionStart === textarea.selectionEnd) {
        e.preventDefault();
        const textAfterCursor = value.substring(cursorPosition);
        const newValue = textBeforeCursor.substring(0, textBeforeCursor.length - 2) + textAfterCursor;
        onChange(newValue);
        
        setTimeout(() => {
          const newCursorPosition = cursorPosition - 2;
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
      }
    }
  };

  const formatTextWithBullets = () => {
    if (!value) return;
    
    const lines = value.split('\n');
    const formattedLines = lines.map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
        return '• ' + trimmedLine;
      }
      return line;
    });
    
    const newValue = formattedLines.join('\n');
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          formatTextWithBullets();
          onBlur?.();
        }}
        onFocus={onFocus}
        rows={rows}
        className={cn(
          "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/10 resize-y font-mono text-sm leading-relaxed",
          className
        )}
        placeholder={placeholder}
        style={{
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap'
        }}
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded">
        Enter: Nuevo bullet | Shift+Enter: Nueva línea
      </div>
    </div>
  );
}