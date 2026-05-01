import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, CheckCircle2, Circle, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  modeLabel?: string;
}

export const TodoTable: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  // 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem('user_prep_todos');
    if (saved) setTodos(JSON.parse(saved));
  }, []);

  // 监听 localStorage 变化（当聊天区添加新待办时）
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('user_prep_todos');
      if (saved) setTodos(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 切换完成状态
  const toggleTodo = (id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    localStorage.setItem('user_prep_todos', JSON.stringify(updated));
    if (updated.find(t => t.id === id)?.completed) {
      toast.success('干得漂亮！任务已完成 🌟');
    }
  };

  // 删除
  const deleteTodo = (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    localStorage.setItem('user_prep_todos', JSON.stringify(updated));
  };

  return (
    <div className="bg-white rounded-[32px] border-2 border-gray-100 p-8 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">备赛行动清单</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Generated Action Items</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-blue-600">{todos.filter(t => t.completed).length}</span>
          <span className="text-xs font-bold text-gray-300 ml-1">/ {todos.length} Done</span>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode='popLayout'>
          {todos.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-gray-400 font-bold italic">暂无待办任务，快去和 AI 导师聊聊吧！</p>
            </div>
          ) : (
            todos.map((todo) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={todo.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  todo.completed 
                    ? 'bg-gray-50 border-transparent opacity-60' 
                    : 'bg-white border-gray-50 shadow-sm hover:border-blue-100'
                }`}
              >
                {/* 打钩控制 */}
                <button 
                  onClick={() => toggleTodo(todo.id)}
                  className={`shrink-0 transition-transform active:scale-90 ${todo.completed ? 'text-emerald-500' : 'text-gray-300 hover:text-blue-500'}`}
                >
                  {todo.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {todo.modeLabel && (
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[9px] font-black rounded uppercase">
                        {todo.modeLabel}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[9px] font-bold text-gray-300">
                      <Clock className="w-2.5 h-2.5" /> {todo.createdAt.split('T')[0]}
                    </span>
                  </div>
                  <p className={`text-sm font-bold truncate ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {todo.text}
                  </p>
                </div>

                {/* 删除 */}
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};