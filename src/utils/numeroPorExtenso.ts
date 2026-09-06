/**
 * Utilitário para conversão de valores monetários (BRL) em texto por extenso
 * Suporta valores de R$ 0,00 até R$ 999.999.999,99
 */

const UNIDADES = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'
];

const ESPECIAIS = [
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'
];

const DEZENAS = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
];

const CENTENAS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
];

function converterGrupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  const partes: string[] = [];

  if (c > 0) {
    partes.push(CENTENAS[c]);
  }

  if (d === 1) {
    partes.push(ESPECIAIS[u]);
  } else {
    if (d > 1) {
      partes.push(DEZENAS[d]);
    }
    if (u > 0) {
      partes.push(UNIDADES[u]);
    }
  }

  return partes.join(' e ');
}

export function numeroPorExtenso(valor: number): string {
  if (isNaN(valor) || valor <= 0) return 'zero reais';

  const valorArredondado = Math.round(valor * 100) / 100;
  const inteiros = Math.floor(valorArredondado);
  const centavos = Math.round((valorArredondado - inteiros) * 100);

  const partesTexto: string[] = [];

  // Milhões
  const milhoes = Math.floor(inteiros / 1_000_000);
  const restoMilhoes = inteiros % 1_000_000;

  if (milhoes > 0) {
    const textoMilhoes = converterGrupo(milhoes);
    partesTexto.push(`${textoMilhoes} ${milhoes === 1 ? 'milhão' : 'milhões'}`);
  }

  // Milhares
  const milhares = Math.floor(restoMilhoes / 1_000);
  const restoMilhares = restoMilhoes % 1_000;

  if (milhares > 0) {
    const textoMilhares = converterGrupo(milhares);
    partesTexto.push(`${textoMilhares} mil`);
  }

  // Centenas / Unidades
  if (restoMilhares > 0) {
    partesTexto.push(converterGrupo(restoMilhares));
  }

  let textoReais = '';
  if (inteiros > 0) {
    const separador = partesTexto.length > 1 && restoMilhares > 0 && restoMilhares < 100 ? ' e ' : ', ';
    // Formatação elegante com conectivos
    if (partesTexto.length === 1) {
      textoReais = partesTexto[0];
    } else if (partesTexto.length === 2) {
      textoReais = partesTexto.join(' e ');
    } else {
      textoReais = `${partesTexto.slice(0, -1).join(', ')} e ${partesTexto[partesTexto.length - 1]}`;
    }

    const unidadeMoeda = inteiros === 1 ? 'real' : 'reais';
    textoReais = `${textoReais} ${unidadeMoeda}`;
  }

  // Centavos
  let textoCentavos = '';
  if (centavos > 0) {
    const centavosExtenso = converterGrupo(centavos);
    const unidadeCentavos = centavos === 1 ? 'centavo' : 'centavos';
    textoCentavos = `${centavosExtenso} ${unidadeCentavos}`;
  }

  if (textoReais && textoCentavos) {
    return `${textoReais} e ${textoCentavos}`;
  }
  if (textoReais) {
    return textoReais;
  }
  if (textoCentavos) {
    return textoCentavos;
  }

  return 'zero reais';
}
