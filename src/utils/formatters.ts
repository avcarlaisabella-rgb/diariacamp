export const formatMoney = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const formatTime = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

/**
 * Mask CPF: ***.***.***-45
 * Protects personal data while keeping the last 2 verification digits visible
 */
export const maskCpf = (cpf?: string): string => {
  if (!cpf) return '***.***.***-**';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    const lastDigits = clean.substring(9);
    return `***.***.***-${lastDigits}`;
  }
  // If already formatted or partial
  if (cpf.includes('-')) {
    const parts = cpf.split('-');
    return `***.***.***-${parts[1] || '**'}`;
  }
  return '***.***.***-**';
};

/**
 * Mask Voter Registration (Título de Eleitor): **** **** 0192
 */
export const maskVoterTitle = (title?: string): string => {
  if (!title) return '**** **** ****';
  const clean = title.replace(/\D/g, '');
  if (clean.length >= 8) {
    const last4 = clean.slice(-4);
    return `**** **** ${last4}`;
  }
  return '**** **** ****';
};

/**
 * Mask PIX Key according to type
 */
export const maskPixKey = (key?: string, type?: string): string => {
  if (!key) return '';
  if (type === 'CPF' || key.replace(/\D/g, '').length === 11) {
    return maskCpf(key);
  }
  if (type === 'Celular' || type === 'Telefone') {
    const clean = key.replace(/\D/g, '');
    if (clean.length >= 10) {
      return `(**) *****-${clean.slice(-4)}`;
    }
  }
  if (type === 'E-mail' || type === 'Email' || key.includes('@')) {
    const [user, domain] = key.split('@');
    if (user && domain) {
      const visible = user.slice(0, 2);
      return `${visible}***@${domain}`;
    }
  }
  if (key.length > 8) {
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
  return key;
};

/**
 * Format / Mask Phone: (11) 9****-1234
 */
export const maskPhone = (phone?: string): string => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 3)}****-${clean.slice(7)}`;
  }
  return phone;
};

/**
 * Simple CSV Downloader for reports and payment batches
 */
export const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const processCell = (cell: string | number) => {
    const stringVal = cell === null || cell === undefined ? '' : String(cell);
    return `"${stringVal.replace(/"/g, '""')}"`;
  };

  const csvContent = [
    headers.map(processCell).join(';'),
    ...rows.map(row => row.map(processCell).join(';'))
  ].join('\r\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
