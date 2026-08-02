export type ItemRarity = "comum" | "incomum" | "raro" | "super_raro";

export const SUPER_RARE_ITEMS: Item[] = [];

export type Item = {
  name: string;
  flavor: string;
  effect: string;
};

export const COMMON_ITEMS: Item[] = [
  {
    name: "Moeda da Última Aposta",
    flavor:
      "Uma moeda de cobre fria ao toque. Ao ser lançada, sempre cai na direção do maior perigo próximo.",
    effect:
      "Detecta emboscadas ou tensão. Vantagem em um teste de Percepção relacionado ao perigo indicado, 1×/descanso longo.",
  },
  {
    name: "Vela do Sussurro",
    flavor:
      "Vela azul-escura que só acende em silêncio absoluto. Muito usada por ladrões e conspiradores.",
    effect:
      "Enquanto acesa, pessoas a até 3 m precisam falar baixo involuntariamente — conversas viram sussurros.",
  },
  {
    name: "Garrafa de Névoa Salina",
    flavor: "Pequena garrafa com água cinzenta do porto.",
    effect:
      "Ao quebrar, cria névoa leve de 3 m por 1 minuto. Desvantagem em ataques à distância através dela.",
  },
  {
    name: "Pena da Conta Exata",
    flavor: "Pena de escrever dourada — cobiçada pelos mercadores da Liga das Balanças.",
    effect: "Nunca erra números. Detecta moedas falsas automaticamente ao tocá-las.",
  },
  {
    name: "Sino dos Degraus",
    flavor: "Pequeno sino sem badalo, comum no Bairro das Escadas.",
    effect: "Toca sozinho quando alguém sobe escadas rapidamente a até 18 m.",
  },
];

export const UNCOMMON_ITEMS: Item[] = [
  {
    name: "Máscara da Maré Negra",
    flavor: "Porcelana rachada com marcas azul-escuras.",
    effect:
      "Vê perfeitamente através de chuva, neblina e fumaça leve. 1×/descanso longo, lança equivalente a Fog Cloud.",
  },
  {
    name: "Luvas do Contrabandista",
    flavor: "Couro encharcado, cheirando a maresia.",
    effect:
      "Objetos pequenos escondidos exigem CD alta para serem encontrados. Vantagem em Sleight of Hand.",
  },
  {
    name: "Relógio do Porto Morto",
    flavor: "Relógio de bolso parado às 3:17.",
    effect:
      "1×/dia, repete um teste falho. Após uso, escuta sinos marítimos distantes por alguns segundos.",
  },
  {
    name: "Lâmina do Eco Frio",
    flavor: "Adaga fina de aço azul; sangue atingido evapora como névoa.",
    effect: "+1d4 dano necrótico em criaturas abaixo de metade da vida.",
  },
  {
    name: "Manto das Escadarias",
    flavor: "Capa cinza de tecido pesado.",
    effect:
      "Ignora terreno difícil em escadas, telhados e ladeiras urbanas. Vantagem em Acrobacia nesses ambientes.",
  },
  {
    name: "Lanterna do Vigia Afogado",
    flavor: "Lanterna enferrujada com chama verde.",
    effect:
      "Revela pegadas recentes molhadas ou ensanguentadas. Espíritos e invisíveis próximos produzem reflexos na luz.",
  },
  {
    name: "Chave de Bronze Vivo",
    flavor: "Chave quente ao toque.",
    effect:
      "Abre qualquer fechadura mundana 1×/descanso longo. Depois fica fria e imóvel até o próximo amanhecer.",
  },
  {
    name: "Frasco da Última Maré",
    flavor: "Frasco contendo água que nunca seca.",
    effect:
      "Derramado, cria superfície escorregadia de 6 m. Criaturas devem passar em DEX save ou cair.",
  },
  {
    name: "Anel do Nome Falso",
    flavor: "Anel de prata sem pedra. Muito usado por membros da Rede de Prata.",
    effect:
      "Magia de leitura superficial de mente ou identificação revela um nome falso escolhido pelo usuário.",
  },
  {
    name: "Caixa-Forte de Bolso",
    flavor: "Pequena caixa de ferro negro.",
    effect: "Objetos colocados dentro pesam 10× menos. Capacidade ~15 kg reais.",
  },
];

export const RARE_ITEMS: Item[] = [
  {
    name: "Coração da Tempestade de Miravento",
    flavor:
      "Esfera metálica do tamanho de um punho, cheia de rachaduras brilhantes e runas antigas. Dizem que veio de uma das torres de Miravento após um grande furacão.",
    effect:
      "Resistência a dano elétrico. Descarga de vento e trovão em linha reta — STR save, falha: empurra 6 m e dano trovejante. Em tempestades naturais: sente mudanças climáticas minutos antes e ganha vantagem em Percepção e Sobrevivência. Efeito colateral: sirenes distantes de Miravento ecoam, faíscas correm em paredes próximas e aves ficam agitadas ao redor do portador.",
  },
];
