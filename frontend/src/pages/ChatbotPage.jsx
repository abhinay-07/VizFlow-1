import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, MessageCircle } from "lucide-react";
import { Card, Button, LoadingSpinner } from "../components/ui";
import { useApi } from "../hooks";
import { chatbotAPI } from "../services/api";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: capabilities, loading: capabilitiesLoading } = useApi(
    chatbotAPI.getCapabilities,
    [],
    {
      onError: (error) =>
        console.error("Error fetching chatbot capabilities:", error),
    }
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await chatbotAPI.sendMessage(userMessage.text);
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: response.response,
        timestamp: new Date(),
        data: response.data,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (capabilitiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          Data Chatbot
        </h1>
        <p className="text-gray-600 mt-1">
          Ask questions about your processed data using natural language
        </p>
      </div>

      {/* Capabilities */}
      {capabilities && (
        <Card className="mb-6">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              What I can help you with:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {capabilities.capabilities?.map((capability, index) => (
                <div key={index} className="text-sm text-gray-600">
                  • {capability}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Start a conversation by asking a question about your data!</p>
              <p className="text-sm mt-2">
                Try: "How many customers do we have?" or "Show me error
                statistics"
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.sender === "bot" && (
                  <div className="flex-shrink-0">
                    <Bot className="h-8 w-8 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : message.isError
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  {message.data && (
                    <div className="mt-2 p-2 bg-white rounded text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                {message.sender === "user" && (
                  <div className="flex-shrink-0">
                    <User className="h-8 w-8 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about your data..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
