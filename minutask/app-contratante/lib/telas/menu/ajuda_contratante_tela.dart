import 'package:flutter/material.dart';
import '../../componentes/tela_conteudo_menu.dart';
import '../../tema/app_theme.dart';

class AjudaContratanteTela extends StatelessWidget {
  const AjudaContratanteTela({super.key});

  @override
  Widget build(BuildContext context) {
    return const TelaConteudoMenu(
      variante: MinutaskVariante.contratante,
      titulo: 'Como publicar',
      secoes: [
        SecaoConteudo(
          titulo: 'Local do serviço',
          icone: Icons.place_outlined,
          texto:
              'Informe um endereço com GPS ou coordenadas e defina um valor inicial. '
              'No chat, vocês podem propor e aceitar outro valor — o acordado pelos dois passa a valer.',
        ),
        SecaoConteudo(
          titulo: 'Fotos e descrição',
          icone: Icons.photo_camera_outlined,
          texto:
              'Descreva claramente o serviço e anexe até 5 fotos. '
              'Isso ajuda o trabalhador a entender o que fazer antes de aceitar.',
        ),
        SecaoConteudo(
          titulo: 'Busca de trabalhador',
          icone: Icons.search_rounded,
          texto:
              'Após publicar, o pedido fica visível por cerca de 2 minutos. '
              'Se ninguém aceitar, você pode reenviar com valor maior.',
        ),
        SecaoConteudo(
          titulo: 'Chat e negociação',
          icone: Icons.chat_bubble_outline_rounded,
          texto:
              'Quando alguém aceitar, abra o chat para combinar detalhes. '
              'Vocês podem propor e aceitar um valor final — precisa ser confirmado pelos dois.',
        ),
      ],
    );
  }
}

class PagamentosContratanteTela extends StatelessWidget {
  const PagamentosContratanteTela({super.key});

  @override
  Widget build(BuildContext context) {
    return const TelaConteudoMenu(
      variante: MinutaskVariante.contratante,
      titulo: 'Pagamentos e segurança',
      secoes: [
        SecaoConteudo(
          titulo: 'Nunca adiante dinheiro',
          icone: Icons.warning_amber_rounded,
          texto:
              'Não pague adiantado nem parte do valor ao trabalhador, nem por PIX fora do app. '
              'Golpes costumam pedir depósito antes do serviço.',
        ),
        SecaoConteudo(
          titulo: 'Quando pagar',
          icone: Icons.check_circle_outline_rounded,
          texto:
              'O pagamento é liberado somente após você confirmar que o serviço foi concluído, '
              'pela plataforma Minutask.',
        ),
        SecaoConteudo(
          titulo: 'Valor acordado',
          icone: Icons.handshake_outlined,
          texto:
              'Se negociarem no chat, o valor aceito por ambos passa a valer. '
              'Esse é o valor usado na conclusão do pedido.',
        ),
        SecaoConteudo(
          titulo: 'Problemas',
          icone: Icons.support_agent_outlined,
          texto:
              'Serviço incompleto, atraso grave ou conduta inadequada: '
              'use Emergência e suporte no menu. Guarde prints do chat.',
        ),
      ],
    );
  }
}
