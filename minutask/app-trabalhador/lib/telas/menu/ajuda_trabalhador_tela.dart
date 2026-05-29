import 'package:flutter/material.dart';
import '../../componentes/tela_conteudo_menu.dart';
import '../../tema/app_theme.dart';

class AjudaTrabalhadorTela extends StatelessWidget {
  const AjudaTrabalhadorTela({super.key});

  @override
  Widget build(BuildContext context) {
    return const TelaConteudoMenu(
      variante: MinutaskVariante.trabalhador,
      titulo: 'Como receber ofertas',
      secoes: [
        SecaoConteudo(
          titulo: 'Ficar online',
          icone: Icons.wifi_tethering_rounded,
          texto:
              'Ative o modo online para receber microjobs próximos à sua localização. '
              'Offline, você não aparece para novos pedidos.',
        ),
        SecaoConteudo(
          titulo: 'Aceitar ou recusar',
          icone: Icons.touch_app_outlined,
          texto:
              'Cada oferta mostra valor, descrição e fotos. '
              'Ao aceitar, você confirma que leu as regras de credibilidade — cancelamentos frequentes podem gerar banimento.',
        ),
        SecaoConteudo(
          titulo: 'Chat com o contratante',
          icone: Icons.chat_bubble_outline_rounded,
          texto:
              'Combine detalhes e negocie valor no chat. '
              'Propostas precisam ser aceitas pelos dois lados para valer.',
        ),
        SecaoConteudo(
          titulo: 'Executar o serviço',
          icone: Icons.checklist_rtl_outlined,
          texto:
              'Siga a descrição e as fotos enviadas. '
              'Em caso de dúvida, pergunte no chat antes de começar.',
        ),
      ],
    );
  }
}

class CredibilidadeTela extends StatelessWidget {
  const CredibilidadeTela({super.key});

  @override
  Widget build(BuildContext context) {
    return const TelaConteudoMenu(
      variante: MinutaskVariante.trabalhador,
      titulo: 'Credibilidade',
      secoes: [
        SecaoConteudo(
          titulo: 'Compromisso ao aceitar',
          icone: Icons.verified_user_outlined,
          texto:
              'Aceitar um serviço é um compromisso. '
              'Desistir sem motivo, atrasos repetidos ou não comparecer prejudica outros trabalhadores e contratantes.',
        ),
        SecaoConteudo(
          titulo: 'Banimento',
          icone: Icons.block_outlined,
          texto:
              'A Minutask pode suspender ou banir contas com muitas recusas após aceite, '
              'ausências ou conduta inadequada reportada.',
        ),
        SecaoConteudo(
          titulo: 'Boas práticas',
          icone: Icons.thumb_up_outlined,
          texto:
              'Chegue no horário combinado, mantenha comunicação clara no chat '
              'e finalize o serviço antes de marcar como concluído.',
        ),
      ],
    );
  }
}

class PagamentosTrabalhadorTela extends StatelessWidget {
  const PagamentosTrabalhadorTela({super.key});

  @override
  Widget build(BuildContext context) {
    return const TelaConteudoMenu(
      variante: MinutaskVariante.trabalhador,
      titulo: 'Recebimentos',
      secoes: [
        SecaoConteudo(
          titulo: 'Quando você recebe',
          icone: Icons.account_balance_wallet_outlined,
          texto:
              'O pagamento é liberado somente após o contratante confirmar a conclusão do serviço, '
              'pela plataforma Minutask.',
        ),
        SecaoConteudo(
          titulo: 'Não peça adiantamento',
          icone: Icons.money_off_outlined,
          texto:
              'Nunca solicite PIX ou pagamento antecipado ao contratante. '
              'Transações fora do app não são protegidas e violam as regras.',
        ),
        SecaoConteudo(
          titulo: 'Valor negociado',
          icone: Icons.handshake_outlined,
          texto:
              'Se combinarem um novo valor no chat e ambos aceitarem, '
              'esse passa a ser o valor do serviço.',
        ),
      ],
    );
  }
}
