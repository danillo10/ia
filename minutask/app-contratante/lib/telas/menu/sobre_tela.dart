import 'package:flutter/material.dart';
import '../../componentes/tela_conteudo_menu.dart';
import '../../tema/app_theme.dart';

class SobreTela extends StatelessWidget {
  final MinutaskVariante variante;

  const SobreTela({super.key, required this.variante});

  @override
  Widget build(BuildContext context) {
    final ehContratante = variante == MinutaskVariante.contratante;
    return TelaConteudoMenu(
      variante: variante,
      titulo: 'Sobre o Minutask',
      secoes: [
        SecaoConteudo(
          titulo: 'O que é',
          icone: Icons.bolt_rounded,
          texto:
              'Minutask conecta quem precisa de um serviço rápido a trabalhadores disponíveis na região. '
              'Publique um microjob, combine detalhes no chat e pague com segurança após a conclusão.',
        ),
        SecaoConteudo(
          titulo: ehContratante ? 'App do contratante' : 'App do trabalhador',
          icone: Icons.smartphone_outlined,
          texto: ehContratante
              ? 'Você publica pedidos com valor inicial, envia fotos de referência, '
                  'negocia o valor no chat e acompanha o andamento em tempo real.'
              : 'Você fica online para receber ofertas próximas, aceita ou recusa serviços, '
                  'conversa com o contratante e recebe após concluir o trabalho.',
        ),
        SecaoConteudo(
          titulo: 'Versão',
          icone: Icons.info_outline_rounded,
          texto: 'Minutask MVP 0.1.0\nDemonstração — dados e contatos podem ser fictícios.',
        ),
        SecaoConteudo(
          titulo: 'Privacidade',
          icone: Icons.shield_outlined,
          texto:
              'Sua localização é usada apenas para encontrar trabalhadores próximos ao serviço. '
              'Mensagens do chat ficam registradas para mediação em caso de disputa.',
        ),
      ],
      rodape: Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Text(
          '© ${DateTime.now().year} Minutask — microjobs urgentes',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ),
    );
  }
}
