import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatWithCoach, ChatMessage } from "@/lib/api";

interface ChatComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatComponent({ isOpen, onClose }: ChatComponentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm your Ascendia Socratic Mentor. I'm here to help you craft compelling scholarship applications by guiding you to discover and articulate your own unique story.\n\nI won't write your essays for you - instead, I'll ask thoughtful questions to help you reflect on your experiences and express them authentically.\n\nWhat aspect of your scholarship application would you like to work on today? For example:\n- Personal statement or essay\n- Leadership experiences\n- Community service stories\n- Academic achievements"
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await chatWithCoach(userMessage, messages);
      setMessages(response.conversation_history);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([
        ...newMessages,
        { 
          role: "assistant", 
          content: "I'm sorry, I encountered an error. Please try again in a moment." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Socratic Mentor</h3>
            <p className="text-xs text-indigo-200">Your scholarship application guide</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white hover:bg-white/20"
          data-testid="button-close-chat"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === "assistant" 
                ? "bg-indigo-100 dark:bg-indigo-900" 
                : "bg-gray-100 dark:bg-gray-700"
            }`}>
              {message.role === "assistant" ? (
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
              message.role === "assistant"
                ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                : "bg-indigo-600 text-white"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your experience or ask for guidance..."
            className="min-h-[44px] max-h-[120px] resize-none"
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          I guide, you write. Your authentic voice matters.
        </p>
      </div>
    </div>
  );
}
