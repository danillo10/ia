/// Contatos oficiais e emergência exibidos nos menus do app.
class AppContatos {
  static const suporteEmail = 'suporte@minutask.app';
  static const suporteWhatsApp = '5511999990000';
  static const centralMinutask = '08007771234';

  static const emergenciasBrasil = [
    ContatoEmergencia(
      nome: 'Polícia Militar',
      numero: '190',
      descricao: 'Roubo, agressão ou ameaça imediata.',
      icone: IconsLocal.police,
    ),
    ContatoEmergencia(
      nome: 'SAMU',
      numero: '192',
      descricao: 'Emergência médica.',
      icone: IconsLocal.medical,
    ),
    ContatoEmergencia(
      nome: 'Bombeiros',
      numero: '193',
      descricao: 'Incêndio, acidente ou resgate.',
      icone: IconsLocal.fire,
    ),
  ];
}

class ContatoEmergencia {
  final String nome;
  final String numero;
  final String descricao;
  final String icone;

  const ContatoEmergencia({
    required this.nome,
    required this.numero,
    required this.descricao,
    required this.icone,
  });
}

/// Ícones como strings para evitar import circular — mapeados no widget.
class IconsLocal {
  static const police = 'police';
  static const medical = 'medical';
  static const fire = 'fire';
  static const support = 'support';
  static const chat = 'chat';
}
