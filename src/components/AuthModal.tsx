import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, Lock, User, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onOpenChange }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        if (formData.username.length < 2) throw new Error('用户名太短啦');
        await register(formData.username, formData.email, formData.password);
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] animate-in fade-in duration-300" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[40px] shadow-2xl z-[201] overflow-hidden animate-in zoom-in-95 duration-300 focus:outline-none">
          <Dialog.Title className="sr-only">
            {mode === 'login' ? '极客回归 - 登录' : '加入中心 - 注册'}
          </Dialog.Title>
          <div className="relative p-10 flex flex-col items-center">
            <Dialog.Close className="absolute right-6 top-6 text-gray-300 hover:text-gray-900 bg-gray-50 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>

            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <Dialog.Title className="text-3xl font-black text-gray-900 tracking-tighter mb-2 italic">
              {mode === 'login' ? '极客回归' : '加入中心'}
            </Dialog.Title>
            <p className="text-gray-400 font-bold text-sm mb-8 tracking-wide uppercase">
              {mode === 'login' ? 'Welcome back expert' : 'Start your geek journey'}
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {mode === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <Input
                    placeholder="给自己起个极客名"
                    className="pl-12 h-14 rounded-2xl bg-gray-50 border-none shadow-none focus-visible:ring-blue-600/20 font-bold text-gray-900"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <Input
                  type="email"
                  placeholder="电子邮箱"
                  className="pl-12 h-14 rounded-2xl bg-gray-50 border-none shadow-none focus-visible:ring-blue-600/20 font-bold text-gray-900"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <Input
                  type="password"
                  placeholder="安全密码"
                  className="pl-12 h-14 rounded-2xl bg-gray-50 border-none shadow-none focus-visible:ring-blue-600/20 font-bold text-gray-900"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-100 mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'login' ? '立即进入' : '注册并登录')}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-50 w-full text-center">
              <p className="text-sm font-bold text-gray-400">
                {mode === 'login' ? '还没有账号？' : '已经有账号了？'}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="text-blue-600 ml-2 hover:underline"
                >
                  {mode === 'login' ? '立即创建' : '点击登录'}
                </button>
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
