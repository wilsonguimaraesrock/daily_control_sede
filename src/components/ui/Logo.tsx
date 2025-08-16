import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'full' 
}) => {
  // Tamanhos aumentados em 200% + novo tamanho xs + novo tamanho xl (300% maior)
  const sizeClasses = {
    xs: 'w-12 h-12 text-xs',    // novo tamanho extra pequeno
    sm: 'w-16 h-16 text-sm',    // era w-8 h-8
    md: 'w-24 h-24 text-base',  // era w-12 h-12
    lg: 'w-32 h-32 text-lg',    // era w-16 h-16
    xl: 'w-64 h-64 text-2xl'    // novo tamanho extra grande (300% maior)
  };

  const textSizeClasses = {
    xs: 'text-xs',   // novo tamanho extra pequeno
    sm: 'text-sm',   // era text-xs
    md: 'text-lg',   // era text-sm
    lg: 'text-xl',   // era text-base
    xl: 'text-4xl'   // novo tamanho extra grande
  };

  // Usando logo da pasta public (mais confiável)
  const rockfellerLogoUrl = '/rockfeller-logo.png';

  // ✅ LOGO DO LOGIN - APENAS PARA TAMANHO XL (tela de login)
  if (variant === 'icon' && size === 'xl') {
    return (
      <div className={`${sizeClasses[size]} ${className}`} data-logo="daily-control-login">
        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-xl flex flex-col items-center justify-center shadow-lg border border-blue-500/20">
          <div className="text-white font-black tracking-tight text-center px-2">
            <div className="text-yellow-300 text-3xl leading-tight font-black">Daily</div>
            <div className="text-white text-2xl leading-tight font-black">Control</div>
          </div>
          <img 
            src="/rockfeller-logo.png" 
            alt="Rockfeller" 
            className="w-24 h-24 mt-2 object-contain opacity-80"
          />
        </div>
      </div>
    );
  }

  // ✅ LOGO PADRÃO - APENAS IMAGEM DA ROCKFELLER
  if (variant === 'icon' || variant === 'full') {
    return (
      <div className={`${sizeClasses[size]} ${className}`} data-logo="rockfeller-only">
        <img 
          src="/rockfeller-logo.png" 
          alt="Rockfeller Logo" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`${textSizeClasses[size]} font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 ${className}`}>
        ROCKFELLER
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`} data-logo="rockfeller-full-public-200">
      <div className={`${sizeClasses[size]}`}>
        <img 
          src={rockfellerLogoUrl} 
          alt="Rockfeller Logo" 
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback: mostrar um placeholder simples sem texto "Daily Control"
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `
              <div class="w-full h-full bg-gray-200 rounded-xl flex items-center justify-center">
                <div class="text-gray-500 text-sm">Logo</div>
              </div>
            `;
          }}
          onLoad={() => {
            // Logo loaded successfully
          }}
        />
      </div>
      <div className={`${textSizeClasses[size]} font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400`}>
        ROCKFELLER
      </div>
    </div>
  );
};

export default Logo; 