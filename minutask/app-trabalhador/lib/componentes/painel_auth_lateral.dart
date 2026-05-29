import 'package:flutter/material.dart';
import '../tema/app_theme.dart';
import 'logo_minutask.dart';
import 'texto_gradiente.dart';

class PainelAuthLateral extends StatelessWidget {
  final MinutaskVariante variante;
  final String titulo;
  final String subtitulo;
  final List<String> beneficios;

  const PainelAuthLateral({
    super.key,
    required this.variante,
    required this.titulo,
    required this.subtitulo,
    required this.beneficios,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            MinutaskCores.azul.withValues(alpha: 0.2),
            MinutaskCores.roxo.withValues(alpha: 0.2),
          ],
        ),
        border: const Border(right: BorderSide(color: MinutaskCores.borda)),
      ),
      child: Stack(
        children: [
          Positioned(
            top: MediaQuery.of(context).size.height * 0.2,
            left: MediaQuery.of(context).size.width * 0.1,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: MinutaskCores.azul.withValues(alpha: 0.1),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LogoMinutask(variante: variante, tamanho: 40),
                const Spacer(),
                Text(
                  titulo,
                  style: Theme.of(context).textTheme.displaySmall,
                ),
                const SizedBox(height: 8),
                TextoGradiente(
                  subtitulo,
                  style: Theme.of(context).textTheme.displaySmall,
                  variante: variante,
                ),
                const SizedBox(height: 20),
                Text(
                  variante == MinutaskVariante.contratante
                      ? 'Publique serviços e receba trabalhadores na hora — estilo Uber.'
                      : 'Receba ofertas, aceite ou recuse em segundos.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 28),
                ...beneficios.map(
                  (b) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          size: 20,
                          color: MinutaskCores.corAccent(variante),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            b,
                            style: const TextStyle(
                              color: MinutaskCores.textoSuave,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    _AvatarStack(),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'MVP pronto — login demo já preenchido',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AvatarStack extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const iniciais = ['JD', 'MK', 'AL', 'RS'];
    return SizedBox(
      width: 100,
      height: 36,
      child: Stack(
        children: List.generate(iniciais.length, (i) {
          return Positioned(
            left: i * 22.0,
            child: Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: MinutaskCores.gradienteMarca(MinutaskVariante.contratante),
                shape: BoxShape.circle,
                border: Border.all(color: MinutaskCores.fundo, width: 2),
              ),
              child: Text(
                iniciais[i],
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
