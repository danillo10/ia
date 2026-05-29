import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../componentes/c9_card.dart';
import '../../componentes/c9_fundo.dart';
import '../../core/app_contatos.dart';
import '../../tema/app_theme.dart';

class EmergenciaTela extends StatelessWidget {
  final MinutaskVariante variante;

  const EmergenciaTela({super.key, required this.variante});

  Future<void> _ligar(BuildContext context, String numero) async {
    final uri = Uri(scheme: 'tel', path: numero);
    if (!await launchUrl(uri)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Não foi possível discar $numero')),
        );
      }
    }
  }

  Future<void> _abrirWhatsApp(BuildContext context) async {
    final uri = Uri.parse('https://wa.me/${AppContatos.suporteWhatsApp}');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível abrir o WhatsApp')),
        );
      }
    }
  }

  Future<void> _enviarEmail(BuildContext context) async {
    final uri = Uri(
      scheme: 'mailto',
      path: AppContatos.suporteEmail,
      queryParameters: {'subject': 'Suporte Minutask — emergência no serviço'},
    );
    if (!await launchUrl(uri)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('E-mail: ${AppContatos.suporteEmail}')),
        );
      }
    }
  }

  IconData _icone(String tipo) {
    switch (tipo) {
      case IconsLocal.police:
        return Icons.local_police_outlined;
      case IconsLocal.medical:
        return Icons.medical_services_outlined;
      case IconsLocal.fire:
        return Icons.local_fire_department_outlined;
      default:
        return Icons.phone_in_talk_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: C9Fundo(
        variante: variante,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 16, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                    Text(
                      'Emergência e suporte',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.35)),
                      ),
                      child: const Text(
                        'Em caso de perigo imediato, ligue primeiro para os serviços de emergência. '
                        'Depois, avise a Minutask pelo suporte.',
                        style: TextStyle(height: 1.4, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Emergência no Brasil',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    for (final c in AppContatos.emergenciasBrasil)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: C9Card(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              Icon(_icone(c.icone), color: Colors.redAccent, size: 28),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(c.nome, style: const TextStyle(fontWeight: FontWeight.w800)),
                                    Text(c.descricao, style: Theme.of(context).textTheme.bodySmall),
                                  ],
                                ),
                              ),
                              FilledButton(
                                onPressed: () => _ligar(context, c.numero),
                                style: FilledButton.styleFrom(
                                  backgroundColor: Colors.redAccent,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 14),
                                ),
                                child: Text(c.numero),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                    Text(
                      'Suporte Minutask',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    C9Card(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        children: [
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(Icons.phone_in_talk_outlined, color: MinutaskCores.corAccent(variante)),
                            title: const Text('Central 24h'),
                            subtitle: Text(AppContatos.centralMinutask),
                            trailing: const Icon(Icons.chevron_right_rounded),
                            onTap: () => _ligar(context, AppContatos.centralMinutask),
                          ),
                          const Divider(height: 1),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(Icons.chat_outlined, color: MinutaskCores.corAccent(variante)),
                            title: const Text('WhatsApp suporte'),
                            subtitle: const Text('Problemas durante o serviço'),
                            trailing: const Icon(Icons.chevron_right_rounded),
                            onTap: () => _abrirWhatsApp(context),
                          ),
                          const Divider(height: 1),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(Icons.mail_outline_rounded, color: MinutaskCores.corAccent(variante)),
                            title: const Text('E-mail'),
                            subtitle: Text(AppContatos.suporteEmail),
                            trailing: const Icon(Icons.chevron_right_rounded),
                            onTap: () => _enviarEmail(context),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
