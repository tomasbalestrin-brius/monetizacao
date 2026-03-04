import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@bethel/shared-auth';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(8, 'Senha deve ter pelo menos 8 caracteres');

const rotatingValues = [
  'Você veio pra ser mais.',
  'Nosso propósito de vida é realizado com o trabalho.',
  'Não nos pergunte se fomos capazes, nos dê a missão.',
  'Nossa liderança inspira confiança e ação.',
  'Superamos expectativas e alcançamos resultados acima da média.',
  'Sempre gratos, porém insatisfeitos!',
  'Assumimos a responsabilidade e agimos rapidamente para resolver qualquer desafio.',
  'Nosso ambiente é de frequência elevada, inspirando alta performance e crescimento contínuo.',
];

function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % rotatingValues.length);
        setIsVisible(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {rotatingValues[currentIndex]}
    </span>
  );
}

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = useCallback((): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message.includes('Invalid login credentials')
            ? 'Email ou senha incorretos'
            : error.message;
          setMessage({ type: 'error', text: msg });
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          const msg = error.message.includes('User already registered')
            ? 'Este email já está cadastrado. Tente fazer login.'
            : error.message;
          setMessage({ type: 'error', text: msg });
        } else {
          setMessage({ type: 'success', text: 'Conta criada com sucesso!' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-[#0a0f1c] to-emerald-600/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between h-full px-16 xl:px-24 py-16">
          <div>
            {/* Logo + Nome lado a lado */}
            <div className="flex items-center gap-4 mb-10">
              <img src="/logo.png" alt="Bethel" className="w-12 h-12 object-contain" />
              <h1 className="text-2xl xl:text-3xl font-bold text-white">
                Bethel <span className="text-white">Comercial</span>
              </h1>
            </div>

            {/* Frase principal */}
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4 max-w-lg">
              Profissionalizando o empreendedorismo através da Educação e Tecnologia.
            </h2>

            <p className="text-lg text-slate-400 mb-10 max-w-md leading-relaxed">
              Transformando cada empresa em Casa de Deus.
            </p>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-md">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Valor do dia</p>
              <p className="text-lg font-semibold text-white min-h-[56px] leading-relaxed italic">
                "<RotatingText />"
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-12">
            &copy; {new Date().getFullYear()} Bethel Comercial. Todos os direitos reservados. Desenvolvido por <span className="text-slate-400">Bethel Tech</span>.
          </p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo.png" alt="Bethel" className="w-10 h-10 object-contain" />
              <h1 className="text-2xl font-bold text-white">Bethel Comercial</h1>
            </div>
            <p className="text-sm font-semibold text-white leading-snug mb-1">
              Profissionalizando o empreendedorismo através da Educação e Tecnologia.
            </p>
            <p className="text-xs text-slate-400">
              Transformando cada empresa em Casa de Deus.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <p className="text-slate-400 mt-1">
              {isLogin ? 'Entre com suas credenciais para continuar' : 'Preencha os dados para criar sua conta'}
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-3.5 rounded-xl text-sm ${
              message.type === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                placeholder="seu@email.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-600/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isLogin ? 'Entrando...' : 'Criando conta...'}
                </>
              ) : (
                isLogin ? 'Entrar' : 'Criar conta'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setMessage(null);
              }}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              {isLogin
                ? 'Não tem conta? Criar conta'
                : 'Já tem conta? Fazer login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
