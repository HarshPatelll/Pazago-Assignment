import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Menu, X, MessageSquare, Trash2 } from 'lucide-react';

const ChatInterface = () => {
  const [chatSessions, setChatSessions] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  



  const currentChat = chatSessions.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateChatTitle = (firstMessage) => {
    const words = firstMessage.split(' ').slice(0, 4);
    return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '');
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setChatSessions(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setError(null);
    setSidebarOpen(false);
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chatSessions.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const updateChatMessages = (chatId, newMessages) => {
    setChatSessions(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: newMessages,
              title:
                newMessages.length > 0 && chat.title === 'New Chat'
                  ? generateChatTitle(newMessages[0].content)
                  : chat.title
            }
          : chat
      )
    );
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    let chatId = currentChatId;

    if (!chatId) {
      chatId = Date.now().toString();
      const newChat = {
        id: chatId,
        title: 'New Chat',
        messages: [],
        createdAt: new Date()
      };
      setChatSessions(prev => [newChat, ...prev]);
      setCurrentChatId(chatId);
    }

    const userMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    updateChatMessages(chatId, updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://millions-screeching-vultur.mastra.cloud/api/agents/weatherAgent/stream',
        {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'x-mastra-dev-playground': 'true'
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: userMessage.content }],
            runId: 'weatherAgent',
            maxRetries: 2,
            maxSteps: 5,
            temperature: 0.5,
            topP: 1,
            runtimeContext: {},
            threadId: '21UF16716IT126',
            resourceId: 'weatherAgent'
          })
        }
      );

      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        const assistantMessage = {
          role: 'assistant',
          content: '',
          timestamp: new Date()
        };
        const messagesWithAssistant = [...updatedMessages, assistantMessage];
        updateChatMessages(chatId, messagesWithAssistant);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.trim()) continue;

            let content = '';
            try {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                content =
                  data.choices?.[0]?.delta?.content ||
                  data.content ||
                  data.text ||
                  data.message ||
                  (typeof data === 'string' ? data : '');
              } else {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0 && colonIndex < 3) {
                  const prefix = line.substring(0, colonIndex);
                  const data = line.substring(colonIndex + 1);
                  if (prefix === '0') {
                    content = JSON.parse(data);
                  } else {
                    console.log(`Received ${prefix} data:`, data);
                  }
                } else {
                  const data = JSON.parse(line);
                  content = data.content || data.text || data.message || '';
                }
              }
            } catch (err) {
              content = line;
            }

            if (content) {
              assistantContent += content;
              const updatedMessagesWithContent = messagesWithAssistant.map((msg, index) =>
                index === messagesWithAssistant.length - 1
                  ? { ...msg, content: assistantContent }
                  : msg
              );
              updateChatMessages(chatId, updatedMessagesWithContent);
            }
          }
        }

        if (!assistantContent.trim()) {
          const fallback = 'Sorry, something went wrong. Please try again.';
          const updated = messagesWithAssistant.map((msg, index) =>
            index === messagesWithAssistant.length - 1
              ? { ...msg, content: fallback }
              : msg
          );
          updateChatMessages(chatId, updated);
        }
      }
    } catch (err) {
      setError('Failed to fetch weather.');
      updateChatMessages(chatId, updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = (now - new Date(date)) / 1000 / 60 / 60;
    if (diff < 24) return 'Today';
    if (diff < 48) return 'Yesterday';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 w-64 h-full bg-gray-900 text-white transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-700">
            <button onClick={createNewChat} className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-3">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Chat</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chatSessions.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chats yet</p>
              </div>
            ) : (
              chatSessions.map(chat => (
                <div key={chat.id} onClick={() => { setCurrentChatId(chat.id); setSidebarOpen(false); }}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer ${currentChatId === chat.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(chat.createdAt)}</p>
                  </div>
                  <button onClick={(e) => deleteChat(chat.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-medium text-gray-800">
              {currentChat ? currentChat.title : 'Weather Agent'}
            </h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-8">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center rotate-45">
                  <div className="w-6 h-6 bg-white rounded-full -rotate-45"></div>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">How can I help you today?</h2>
              <p className="text-gray-500 text-center max-w-md">Ask me about weather conditions, forecasts, or any weather-related questions.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message, i) => (
                <div key={i} className="space-y-2">
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-md max-w-xs lg:max-w-md">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-md max-w-xs lg:max-w-2xl">
                        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-md">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )} */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 py-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-100 p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about weather..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base disabled:bg-gray-50"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300"
              >
                
                <Send className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;



