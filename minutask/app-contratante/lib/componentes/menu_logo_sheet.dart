import 'package:flutter/material.dart';
import '../servicos/api_service.dart';
import '../tema/app_theme.dart';
import '../telas/login_tela.dart';
import '../telas/menu/ajuda_contratante_tela.dart';
import '../telas/menu/emergencia_tela.dart';
import '../telas/menu/perfil_tela.dart';
import '../telas/menu/sobre_tela.dart';

class MenuLogoSheet {
  static Future<void> mostrar(
    BuildContext context, {
    required ApiService api,
  }) {
    final u = api.usuario ?? {};
    final nome = u['nome']?.toString() ?? 'Contratante';

    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _MenuSheet(
        nome: nome,
        email: u['email']?.toString(),
        itens: [
          _ItemMenu(
            icone: Icons.person_outline_rounded,
            titulo: 'Minha conta',
            subtitulo: 'Dados do perfil',
            onTap: () => _abrir(ctx, PerfilTela(api: api, variante: MinutaskVariante.contratante)),
          ),
          _ItemMenu(
            icone: Icons.add_circle_outline_rounded,
            titulo: 'Como publicar',
            subtitulo: 'Local, valor e fotos',
            onTap: () => _abrir(ctx, const AjudaContratanteTela()),
          ),
          _ItemMenu(
            icone: Icons.payments_outlined,
            titulo: 'Pagamentos e segurança',
            subtitulo: 'Regras e proteção',
            onTap: () => _abrir(ctx, const PagamentosContratanteTela()),
          ),
          _ItemMenu(
            icone: Icons.emergency_outlined,
            titulo: 'Emergência e suporte',
            subtitulo: '190, 192, 193 e central Minutask',
            destaque: true,
            onTap: () => _abrir(ctx, const EmergenciaTela(variante: MinutaskVariante.contratante)),
          ),
          _ItemMenu(
            icone: Icons.info_outline_rounded,
            titulo: 'Sobre o app',
            subtitulo: 'Versão e informações',
            onTap: () => _abrir(ctx, const SobreTela(variante: MinutaskVariante.contratante)),
          ),
        ],
        onSair: () async {
          Navigator.pop(ctx);
          await api.limparSessao();
          if (!context.mounted) return;
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => LoginTela(api: api)),
            (_) => false,
          );
        },
      ),
    );
  }

  static void _abrir(BuildContext sheetCtx, Widget tela) {
    Navigator.pop(sheetCtx);
    Navigator.of(sheetCtx).push(MaterialPageRoute(builder: (_) => tela));
  }
}

class _ItemMenu {
  final IconData icone;
  final String titulo;
  final String subtitulo;
  final VoidCallback onTap;
  final bool destaque;

  _ItemMenu({
    required this.icone,
    required this.titulo,
    required this.subtitulo,
    required this.onTap,
    this.destaque = false,
  });
}

class _MenuSheet extends StatelessWidget {
  final String nome;
  final String? email;
  final List<_ItemMenu> itens;
  final VoidCallback onSair;

  const _MenuSheet({
    required this.nome,
    required this.email,
    required this.itens,
    required this.onSair,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 16),
      decoration: BoxDecoration(
        color: MinutaskCores.superficie,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: MinutaskCores.bordaForte),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: MinutaskCores.textoMuted,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: MinutaskCores.gradienteMarca(MinutaskVariante.contratante),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: Text(
                        nome.isNotEmpty ? nome[0].toUpperCase() : 'C',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(nome, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        if (email != null)
                          Text(
                            email!,
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: itens.length,
                separatorBuilder: (_, __) => const SizedBox(height: 2),
                itemBuilder: (_, i) {
                  final item = itens[i];
                  final cor = item.destaque ? Colors.redAccent : MinutaskCores.azul;
                  return ListTile(
                    leading: Icon(item.icone, color: cor),
                    title: Text(item.titulo, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(item.subtitulo, style: Theme.of(context).textTheme.bodySmall),
                    trailing: const Icon(Icons.chevron_right_rounded, color: MinutaskCores.textoMuted),
                    onTap: item.onTap,
                  );
                },
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: Colors.redAccent),
              title: const Text('Sair da conta', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: onSair,
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
