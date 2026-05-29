import 'package:flutter/material.dart';
import 'c9_card.dart';
import 'c9_fundo.dart';
import '../tema/app_theme.dart';

class SecaoConteudo {
  final String titulo;
  final String texto;
  final IconData? icone;

  const SecaoConteudo({required this.titulo, required this.texto, this.icone});
}

class TelaConteudoMenu extends StatelessWidget {
  final MinutaskVariante variante;
  final String titulo;
  final List<SecaoConteudo> secoes;
  final Widget? rodape;

  const TelaConteudoMenu({
    super.key,
    required this.variante,
    required this.titulo,
    required this.secoes,
    this.rodape,
  });

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
                    Expanded(
                      child: Text(
                        titulo,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  children: [
                    for (final s in secoes) ...[
                      C9Card(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (s.icone != null)
                              Row(
                                children: [
                                  Icon(s.icone, color: MinutaskCores.corAccent(variante), size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      s.titulo,
                                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                    ),
                                  ),
                                ],
                              )
                            else
                              Text(
                                s.titulo,
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                              ),
                            const SizedBox(height: 8),
                            Text(
                              s.texto,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.45),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (rodape != null) rodape!,
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
