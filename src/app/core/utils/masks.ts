const digitos = (v: string) => v.replace(/\D/g, '');

export const maskCpf = (v: string): string => {
  const d = digitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

export const maskTelefone = (v: string): string => {
  const d = digitos(v).slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const maskCep = (v: string): string => {
  const d = digitos(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export const maskData = (v: string): string => {
  const d = digitos(v).slice(0, 8);
  return d
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
};

export const PATTERNS = {
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  telefone: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  cep: /^\d{5}-\d{3}$/,
  data: /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
} as const;
