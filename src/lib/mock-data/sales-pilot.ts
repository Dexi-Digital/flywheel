// Dados mockados para o Sales Pilot - Assistente Técnico Especializado

export type ModeloVolvo = 'EX30' | 'XC40' | 'C40' | 'XC60' | 'XC90';
export type TemaTecnico = 'Autonomia' | 'Carregamento' | 'Segurança' | 'Manutenção' | 'Conectividade' | 'Suspensão' | 'Performance' | 'Garantia';
export type TipoInteracao = 'texto' | 'voz';
export type TipoRecurso = 'foto' | 'pdf_comparativo' | 'diagnostico_visual';

export interface ConsultaTecnica {
  id: string;
  timestamp: string;
  vendedor: string;
  modelo: ModeloVolvo;
  tema: TemaTecnico;
  pergunta: string;
  resposta: string;
  confianca: number; // 0-100
  tempo_resposta_segundos: number;
  tipo_interacao: TipoInteracao;
  escalado_nivel2: boolean;
  recursos_entregues: TipoRecurso[];
  sentimento: 'positivo' | 'neutro' | 'negativo';
}

export interface MapaCalorDuvidas {
  modelo: ModeloVolvo;
  temas: Record<TemaTecnico, number>; // número de consultas por tema
}

export interface MetricasSalesPilot {
  consultas_respondidas: number;
  taxa_precisao: number; // % de respostas com confiança >80%
  escalacoes_nivel2: number;
  satisfacao_rede: number; // % de sentimento positivo
  tempo_medio_resposta: number; // segundos
  confianca_media: number; // 0-100
  fotos_entregues: number;
  pdfs_entregues: number;
  diagnosticos_realizados: number;
}

// Consultas técnicas recentes (últimas 20)
export const CONSULTAS_TECNICAS: ConsultaTecnica[] = [
  {
    id: 'ct-001',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1h atrás
    vendedor: 'Carlos Silva',
    modelo: 'EX30',
    tema: 'Autonomia',
    pergunta: 'Qual a autonomia real do EX30 em condições urbanas?',
    resposta: 'O Volvo EX30 oferece até 476 km de autonomia (WLTP) na versão Extended Range. Em condições urbanas, a autonomia pode chegar a 550 km devido à eficiência da regeneração de energia.',
    confianca: 95,
    tempo_resposta_segundos: 2.3,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['foto'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-002',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
    vendedor: 'Ana Paula',
    modelo: 'XC40',
    tema: 'Carregamento',
    pergunta: 'Quanto tempo leva para carregar o XC40 Recharge de 10% a 80%?',
    resposta: 'Com carregador rápido DC de 150 kW, o XC40 Recharge carrega de 10% a 80% em aproximadamente 37 minutos. Em wallbox AC 11kW, o tempo é de cerca de 8 horas.',
    confianca: 92,
    tempo_resposta_segundos: 1.8,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['pdf_comparativo'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-003',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h atrás
    vendedor: 'Roberto Mendes',
    modelo: 'C40',
    tema: 'Segurança',
    pergunta: 'O C40 tem sistema de frenagem autônoma de emergência?',
    resposta: 'Sim, o C40 vem de série com City Safety, que inclui frenagem autônoma de emergência com detecção de pedestres, ciclistas e animais de grande porte, funcionando dia e noite.',
    confianca: 98,
    tempo_resposta_segundos: 1.5,
    tipo_interacao: 'voz',
    escalado_nivel2: false,
    recursos_entregues: ['foto', 'diagnostico_visual'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-004',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5h atrás
    vendedor: 'Juliana Costa',
    modelo: 'XC60',
    tema: 'Manutenção',
    pergunta: 'Qual o intervalo de revisão do XC60 híbrido?',
    resposta: 'O XC60 Recharge tem intervalo de revisão de 12 meses ou 15.000 km, o que ocorrer primeiro. A manutenção do sistema elétrico é mínima, focando principalmente no motor a combustão.',
    confianca: 88,
    tempo_resposta_segundos: 2.1,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: [],
    sentimento: 'neutro',
  },
  {
    id: 'ct-005',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h atrás
    vendedor: 'Marcos Oliveira',
    modelo: 'XC90',
    tema: 'Conectividade',
    pergunta: 'O XC90 tem integração com Apple CarPlay sem fio?',
    resposta: 'Sim, o XC90 2024 oferece Apple CarPlay e Android Auto sem fio de série, além do sistema Google integrado com Google Maps, Google Assistant e Google Play Store.',
    confianca: 96,
    tempo_resposta_segundos: 1.9,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['foto'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-006',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h atrás
    vendedor: 'Patricia Alves',
    modelo: 'EX30',
    tema: 'Performance',
    pergunta: 'Qual a aceleração 0-100 km/h do EX30 Twin Motor?',
    resposta: 'O EX30 Twin Motor Performance acelera de 0 a 100 km/h em apenas 3,6 segundos, com potência de 428 cv e tração integral.',
    confianca: 94,
    tempo_resposta_segundos: 1.6,
    tipo_interacao: 'voz',
    escalado_nivel2: false,
    recursos_entregues: ['pdf_comparativo'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-007',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10h atrás
    vendedor: 'Fernando Santos',
    modelo: 'XC40',
    tema: 'Garantia',
    pergunta: 'A bateria do XC40 Recharge tem garantia diferenciada?',
    resposta: 'Sim, a bateria do XC40 Recharge tem garantia de 8 anos ou 160.000 km para manter pelo menos 70% da capacidade original.',
    confianca: 91,
    tempo_resposta_segundos: 2.0,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: [],
    sentimento: 'positivo',
  },
  {
    id: 'ct-008',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12h atrás
    vendedor: 'Luciana Ferreira',
    modelo: 'C40',
    tema: 'Suspensão',
    pergunta: 'O C40 tem suspensão adaptativa? Como funciona em diferentes modos de condução?',
    resposta: 'Não tenho informações completas sobre as especificações técnicas da suspensão adaptativa do C40. Recomendo consultar um especialista técnico para detalhes precisos.',
    confianca: 65,
    tempo_resposta_segundos: 2.8,
    tipo_interacao: 'texto',
    escalado_nivel2: true,
    recursos_entregues: [],
    sentimento: 'neutro',
  },
  {
    id: 'ct-009',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14h atrás
    vendedor: 'Ricardo Gomes',
    modelo: 'XC60',
    tema: 'Autonomia',
    pergunta: 'Qual a autonomia elétrica do XC60 Recharge em modo híbrido?',
    resposta: 'O XC60 Recharge oferece até 81 km de autonomia 100% elétrica (WLTP). Ideal para deslocamentos urbanos diários sem usar combustível.',
    confianca: 93,
    tempo_resposta_segundos: 1.7,
    tipo_interacao: 'voz',
    escalado_nivel2: false,
    recursos_entregues: ['foto', 'pdf_comparativo'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-010',
    timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), // 16h atrás
    vendedor: 'Beatriz Lima',
    modelo: 'XC90',
    tema: 'Carregamento',
    pergunta: 'É possível programar o horário de carregamento do XC90 Recharge?',
    resposta: 'Sim, através do aplicativo Volvo Cars você pode programar horários de carregamento para aproveitar tarifas mais baixas de energia, além de pré-climatizar o veículo.',
    confianca: 97,
    tempo_resposta_segundos: 1.4,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['diagnostico_visual'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-011',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18h atrás
    vendedor: 'André Martins',
    modelo: 'EX30',
    tema: 'Segurança',
    pergunta: 'Quais são os sistemas ADAS disponíveis no EX30?',
    resposta: 'O EX30 inclui Pilot Assist, controle de cruzeiro adaptativo, assistente de permanência em faixa, monitoramento de ponto cego, e alerta de tráfego cruzado traseiro de série.',
    confianca: 96,
    tempo_resposta_segundos: 2.2,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['foto', 'pdf_comparativo'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-012',
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20h atrás
    vendedor: 'Camila Rocha',
    modelo: 'XC40',
    tema: 'Manutenção',
    pergunta: 'Existe diferença no custo de manutenção entre XC40 a combustão e elétrico?',
    resposta: 'Informações específicas sobre comparação de custos de manutenção não estão disponíveis no momento. Sugiro contato com o departamento de pós-venda.',
    confianca: 58,
    tempo_resposta_segundos: 3.1,
    tipo_interacao: 'voz',
    escalado_nivel2: true,
    recursos_entregues: [],
    sentimento: 'negativo',
  },
  {
    id: 'ct-013',
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22h atrás
    vendedor: 'Diego Souza',
    modelo: 'C40',
    tema: 'Conectividade',
    pergunta: 'O C40 recebe atualizações OTA (over-the-air)?',
    resposta: 'Sim, o C40 recebe atualizações de software remotas (OTA) que melhoram funcionalidades, segurança e desempenho sem necessidade de visita à concessionária.',
    confianca: 99,
    tempo_resposta_segundos: 1.3,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['diagnostico_visual'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-014',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    vendedor: 'Elaine Barbosa',
    modelo: 'XC60',
    tema: 'Performance',
    pergunta: 'Qual a potência combinada do XC60 Recharge?',
    resposta: 'O XC60 Recharge combina motor a combustão e elétrico para entregar 455 cv de potência total e 71,4 kgfm de torque.',
    confianca: 95,
    tempo_resposta_segundos: 1.5,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['pdf_comparativo'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-015',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    vendedor: 'Fabio Cardoso',
    modelo: 'XC90',
    tema: 'Garantia',
    pergunta: 'Qual a cobertura da garantia de fábrica do XC90?',
    resposta: 'O XC90 tem garantia de fábrica de 3 anos sem limite de quilometragem, além de 12 anos contra corrosão perfurante.',
    confianca: 98,
    tempo_resposta_segundos: 1.6,
    tipo_interacao: 'voz',
    escalado_nivel2: false,
    recursos_entregues: [],
    sentimento: 'positivo',
  },
  {
    id: 'ct-016',
    timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    vendedor: 'Gabriela Nunes',
    modelo: 'EX30',
    tema: 'Carregamento',
    pergunta: 'Qual o tipo de conector de carregamento do EX30?',
    resposta: 'O EX30 utiliza conector CCS2 (Combined Charging System) para carregamento AC e DC, padrão europeu adotado no Brasil.',
    confianca: 97,
    tempo_resposta_segundos: 1.4,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['foto'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-017',
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 1.25 dias atrás
    vendedor: 'Henrique Dias',
    modelo: 'XC40',
    tema: 'Suspensão',
    pergunta: 'O XC40 Recharge tem diferença de altura em relação ao modelo a combustão?',
    resposta: 'Não possuo dados técnicos precisos sobre as diferenças de altura entre as versões. Recomendo consultar a ficha técnica oficial ou especialista.',
    confianca: 72,
    tempo_resposta_segundos: 2.6,
    tipo_interacao: 'texto',
    escalado_nivel2: true,
    recursos_entregues: [],
    sentimento: 'neutro',
  },
  {
    id: 'ct-018',
    timestamp: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(), // 1.3 dias atrás
    vendedor: 'Isabela Castro',
    modelo: 'C40',
    tema: 'Autonomia',
    pergunta: 'Qual o consumo médio do C40 em kWh/100km?',
    resposta: 'O C40 tem consumo médio de 19,5 kWh/100km (WLTP), podendo variar conforme estilo de condução e condições climáticas.',
    confianca: 94,
    tempo_resposta_segundos: 1.8,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['pdf_comparativo'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-019',
    timestamp: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(), // 1.4 dias atrás
    vendedor: 'João Pedro',
    modelo: 'XC60',
    tema: 'Conectividade',
    pergunta: 'O XC60 tem sistema de som premium? Quantos alto-falantes?',
    resposta: 'O XC60 pode ser equipado com sistema de som Bowers & Wilkins com 15 alto-falantes e 1.100W de potência, oferecendo experiência sonora premium.',
    confianca: 96,
    tempo_resposta_segundos: 1.9,
    tipo_interacao: 'voz',
    escalado_nivel2: false,
    recursos_entregues: ['foto', 'diagnostico_visual'],
    sentimento: 'positivo',
  },
  {
    id: 'ct-020',
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 dias atrás
    vendedor: 'Kelly Moreira',
    modelo: 'XC90',
    tema: 'Segurança',
    pergunta: 'Quantos airbags tem o XC90 e qual a classificação de segurança?',
    resposta: 'O XC90 possui 7 airbags e recebeu 5 estrelas no Euro NCAP, com pontuação de 97% em proteção de adultos.',
    confianca: 98,
    tempo_resposta_segundos: 1.7,
    tipo_interacao: 'texto',
    escalado_nivel2: false,
    recursos_entregues: ['foto'],
    sentimento: 'positivo',
  },
];

// Mapa de calor: modelos vs temas técnicos
export const MAPA_CALOR_DUVIDAS: MapaCalorDuvidas[] = [
  {
    modelo: 'EX30',
    temas: {
      'Autonomia': 12,
      'Carregamento': 8,
      'Segurança': 6,
      'Manutenção': 3,
      'Conectividade': 4,
      'Suspensão': 2,
      'Performance': 7,
      'Garantia': 3,
    },
  },
  {
    modelo: 'XC40',
    temas: {
      'Autonomia': 8,
      'Carregamento': 11,
      'Segurança': 5,
      'Manutenção': 6,
      'Conectividade': 3,
      'Suspensão': 4,
      'Performance': 4,
      'Garantia': 5,
    },
  },
  {
    modelo: 'C40',
    temas: {
      'Autonomia': 9,
      'Carregamento': 7,
      'Segurança': 8,
      'Manutenção': 4,
      'Conectividade': 7,
      'Suspensão': 3,
      'Performance': 5,
      'Garantia': 2,
    },
  },
  {
    modelo: 'XC60',
    temas: {
      'Autonomia': 10,
      'Carregamento': 9,
      'Segurança': 6,
      'Manutenção': 7,
      'Conectividade': 6,
      'Suspensão': 3,
      'Performance': 6,
      'Garantia': 4,
    },
  },
  {
    modelo: 'XC90',
    temas: {
      'Autonomia': 6,
      'Carregamento': 7,
      'Segurança': 9,
      'Manutenção': 4,
      'Conectividade': 5,
      'Suspensão': 2,
      'Performance': 3,
      'Garantia': 6,
    },
  },
];

// Métricas agregadas calculadas
const totalConsultas = CONSULTAS_TECNICAS.length;
const consultasAltaConfianca = CONSULTAS_TECNICAS.filter(c => c.confianca >= 80).length;
const consultasEscaladas = CONSULTAS_TECNICAS.filter(c => c.escalado_nivel2).length;
const sentimentosPositivos = CONSULTAS_TECNICAS.filter(c => c.sentimento === 'positivo').length;
const confiancaMedia = CONSULTAS_TECNICAS.reduce((sum, c) => sum + c.confianca, 0) / totalConsultas;
const tempoMedioResposta = CONSULTAS_TECNICAS.reduce((sum, c) => sum + c.tempo_resposta_segundos, 0) / totalConsultas;
const fotosEntregues = CONSULTAS_TECNICAS.reduce((sum, c) => sum + c.recursos_entregues.filter(r => r === 'foto').length, 0);
const pdfsEntregues = CONSULTAS_TECNICAS.reduce((sum, c) => sum + c.recursos_entregues.filter(r => r === 'pdf_comparativo').length, 0);
const diagnosticosRealizados = CONSULTAS_TECNICAS.reduce((sum, c) => sum + c.recursos_entregues.filter(r => r === 'diagnostico_visual').length, 0);

export const METRICAS_SALES_PILOT: MetricasSalesPilot = {
  consultas_respondidas: totalConsultas,
  taxa_precisao: (consultasAltaConfianca / totalConsultas) * 100,
  escalacoes_nivel2: consultasEscaladas,
  satisfacao_rede: (sentimentosPositivos / totalConsultas) * 100,
  tempo_medio_resposta: tempoMedioResposta,
  confianca_media: confiancaMedia,
  fotos_entregues: fotosEntregues,
  pdfs_entregues: pdfsEntregues,
  diagnosticos_realizados: diagnosticosRealizados,
};


