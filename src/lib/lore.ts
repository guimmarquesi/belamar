// Conhecimento comum sobre Belamar — informações públicas que todos os
// personagens (incluindo Bandolim) já sabem ao chegar na cidade.

export const CITY_OVERVIEW = `Uma cidade portuária rica, elegante e viva. Construída sobre o comércio e protegida pelo mar, Belamar é conhecida por suas ruas de pedra clara, arquitetura refinada e um fluxo constante de navios, mercadores e viajantes. Aqui, sempre há algo acontecendo — negócios sendo fechados, festas acontecendo e oportunidades surgindo.

Mas nem tudo é tão simples quanto parece. Entre bairros nobres e áreas mais humildes, a cidade se sustenta sobre acordos silenciosos, interesses ocultos e histórias que poucos ousam investigar. Algumas pessoas desaparecem. Certos nomes são evitados. E há lugares onde é melhor não fazer perguntas.

A chuva fina que cobre Belamar com frequência parece lavar as ruas… mas nunca leva tudo embora.`;

export type District = { name: string; description: string };

export const DISTRICTS: District[] = [
  {
    name: "Vila Clara",
    description:
      "Ruas limpas, casas elegantes e jardins bem cuidados. Famílias ricas e respeitadas. Grandes muros, guardas 24h — só entra quem tem documentação necessária.",
  },
  {
    name: "Valedouro",
    description:
      "O coração comercial da cidade. Mercados, contratos, negociações e ouro circulando o tempo todo. Bairro com regras próprias, incluindo a proibição do álcool.",
  },
  {
    name: "Miravento",
    description:
      "Torres altas e observatórios. Estudiosos, navegadores e inventores. Abriga a maior escola de Belamar; suas torres mantêm a meteorologia afiada e a defesa contra ataques.",
  },
  {
    name: "Lago da Garoa",
    description:
      "Bonito, silencioso e coberto por uma garoa que nunca para. Ideal para encontros discretos. Abriga o cemitério principal, templos e igrejas.",
  },
  {
    name: "Colina da Aurora",
    description:
      "A parte mais nobre da cidade. Mansões, festas e influência política. Sede do Conselho da Maré, a guilda principal que governa Belamar.",
  },
  {
    name: "Bairro das Escadas",
    description:
      "Ruas estreitas, caminhos confusos, construções apertadas. Fácil se perder, fácil se esconder. Residencial — trabalhadores e conexões de trabalho.",
  },
  {
    name: "Morro das Cordas",
    description:
      "Zona de trabalho pesado junto ao porto. Casas empilhadas em encostas que deslizam com a chuva — um inventor pobre criou a arquitetura suspensa por cordas que mantém o bairro em pé.",
  },
  {
    name: "Âncora Baixa",
    description:
      "Antigo porto abandonado, hoje território de jogos, apostas e negócios ilegais. Apesar disso, extremamente organizado — supervisionado pela Maré Negra, guilda de pescadores que se tornou potência.",
  },
  {
    name: "Pedra Muda",
    description:
      "A prisão da cidade. Local mais antigo de Belamar, fundada pelo primeiro rei. Poucos falam dela — menos ainda saem com histórias para contar.",
  },
];

export type Era = { name: string; description: string };

export const ERAS: Era[] = [
  {
    name: "Era I — Fundação das Marés",
    description:
      "Belamar nasceu quando navegadores foram guiados por luzes misteriosas até uma baía segura. Nesse período foi construída Pedra Muda, o local mais antigo da cidade.",
  },
  {
    name: "Era II — Reino de Pedra Clara",
    description:
      "A cidade cresceu sob o domínio de um rei. Surgiram muralhas, bairros, templos e as primeiras guildas, estruturando o comércio e a vida urbana.",
  },
  {
    name: "Era III — Velas Rubras",
    description:
      "Uma grande guerra marcou a era. Belamar resistiu a uma invasão e saiu mais forte, enriquecendo com o comércio e dando início à ascensão das grandes famílias.",
  },
  {
    name: "Era IV — Silêncio do Rei",
    description:
      "O último rei desapareceu e o poder passou para o Conselho da Maré, que governa até hoje. Desde então, Belamar se tornou mais política — e mais perigosa.",
  },
  {
    name: "Era V — Vento e Ouro (atual)",
    description:
      "Belamar vive seu auge. Comércio intenso, crescimento acelerado e a ascensão de Miravento com suas torres e avanços em tecnomagia. Mas nem tudo cresce em equilíbrio.",
  },
];

export const FIGURES_INTRO = `Belamar é movida por pessoas — algumas visíveis, outras nem tanto. Há figuras influentes no comércio, na política e no porto, cada uma com seu próprio tipo de poder. Nem todos são aliados, nem todos são inimigos, mas todos têm impacto. Em Belamar, conhecer a pessoa certa pode abrir portas — ou fechar todas elas.`;

export const FIGURES: string[] = [
  "Um renomado criador de roupas finas, cuja marca veste os mais ricos da cidade.",
  "Uma capitã respeitada que comanda cozinhas e navios, alimentando metade do porto.",
  "Membros do Conselho da Maré, que governam Belamar com decisões difíceis de questionar.",
  "Estudiosos de Miravento que observam o céu e o mar em busca de padrões e respostas.",
  "Líderes informais das ruas e dos trabalhadores, que mantêm a cidade funcionando de verdade.",
  "Pessoas que sabem demais — e falam de menos.",
];

export const FACTIONS_KNOWN: { name: string; description: string }[] = [
  {
    name: "Conselho da Maré",
    description:
      "Guilda principal que governa Belamar desde o desaparecimento do último rei. Sediada na Colina da Aurora.",
  },
  {
    name: "Maré Negra",
    description:
      "Renomada guilda de pescadores transformada em potência. Supervisiona Âncora Baixa e seus negócios — incluindo os ilegais.",
  },
  {
    name: "Torres de Miravento",
    description:
      "Ordem de estudiosos, navegadores e inventores. Mantêm meteorologia, escola e defesa da cidade.",
  },
];
