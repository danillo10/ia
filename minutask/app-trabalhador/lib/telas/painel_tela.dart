import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../componentes/c9_card.dart';
import '../componentes/c9_fundo.dart';
import '../componentes/logo_minutask.dart';
import '../componentes/menu_logo_sheet.dart';
import '../core/config.dart';
import '../core/formato_data.dart';
import '../componentes/dialogo_credibilidade.dart';
import '../servicos/notificacao_local.dart';
import '../servicos/api_service.dart';
import '../telas/chat_tela.dart';
import '../tema/app_theme.dart';

class PainelTela extends StatefulWidget {
  final ApiService api;
  const PainelTela({super.key, required this.api});

  @override
  State<PainelTela> createState() => _PainelTelaState();
}

class _PainelTelaState extends State<PainelTela> {
  bool _online = false;
  List<Map<String, dynamic>> _ofertas = [];
  WebSocketChannel? _canal;
  Timer? _polling;
  final Set<int> _servicosAlertados = {};

  void _alertarNovoServico(Map<String, dynamic> dados) {
    final id = dados['id'] as int?;
    if (id == null || !_online || _servicosAlertados.contains(id)) return;
    _servicosAlertados.add(id);
    final valor = dados['valor_publicado'] ?? dados['valor_sugerido'];
    NotificacaoLocal.instancia.alertaNovoServico(
      tarefaId: id,
      descricao: dados['descricao']?.toString() ?? 'Novo microjob',
      valor: valor is num ? valor.toDouble() : double.tryParse('$valor'),
    );
  }

  @override
  void dispose() {
    _canal?.sink.close();
    _polling?.cancel();
    super.dispose();
  }

  Future<void> _alternarOnline(bool valor) async {
    double? lat;
    double? lon;
    if (valor) {
      final pos = await Geolocator.getCurrentPosition();
      lat = pos.latitude;
      lon = pos.longitude;
    }
    await widget.api.definirOnline(valor, lat: lat, lon: lon);
    setState(() => _online = valor);
    if (valor) {
      _conectarWs();
      _iniciarPolling();
      await _atualizarLista();
    } else {
      _canal?.sink.close();
      _polling?.cancel();
      setState(() => _ofertas = []);
    }
  }

  void _conectarWs() {
    final id = widget.api.usuarioId;
    if (id == null) return;
    _canal = WebSocketChannel.connect(Uri.parse(Config.wsTrabalhador(id)));
    _canal!.stream.listen((msg) {
      final dados = jsonDecode(msg as String) as Map<String, dynamic>;
      if (dados['evento'] == 'nova_tarefa') {
        final oferta = Map<String, dynamic>.from(dados);
        _alertarNovoServico(oferta);
        setState(() {
          final id = dados['id'];
          _ofertas.removeWhere((o) => o['id'] == id);
          _ofertas.insert(0, oferta);
        });
      } else if (dados['evento'] == 'tarefa_aceita') {
        setState(() {
          _ofertas.removeWhere((o) => o['id'] == dados['tarefa_id']);
        });
      }
    });
  }

  void _iniciarPolling() {
    _polling = Timer.periodic(const Duration(seconds: 15), (_) => _atualizarLista());
  }

  Future<void> _atualizarLista() async {
    final lista = await widget.api.listarDisponiveis();
    final idsAntigos = _ofertas.map((o) => o['id'] as int).toSet();
    final novaLista = lista.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    for (final o in novaLista) {
      final id = o['id'] as int?;
      if (id != null && !idsAntigos.contains(id)) {
        _alertarNovoServico(o);
      }
    }
    setState(() => _ofertas = novaLista);
  }

  Future<void> _aceitar(Map<String, dynamic> oferta) async {
    final id = oferta['id'] as int;
    final confirmou = await DialogoCredibilidadeAceite.mostrar(
      context,
      descricao: oferta['descricao']?.toString() ?? 'Microjob',
    );
    if (confirmou != true) return;

    try {
      await widget.api.aceitar(id);
      setState(() => _ofertas.removeWhere((o) => o['id'] == id));
      if (!mounted) return;
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ChatTela(
            api: widget.api,
            tarefaId: id,
            titulo: oferta['descricao']?.toString() ?? 'Microjob',
          ),
        ),
      );
      if (mounted) await _atualizarLista();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      await _atualizarLista();
    }
  }

  Future<void> _recusar(int id) async {
    await widget.api.recusar(id);
    setState(() => _ofertas.removeWhere((o) => o['id'] == id));
  }

  void _verFoto(List<dynamic> fotos, int index) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            InteractiveViewer(
              child: Image.network(
                Config.urlMidia(fotos[index]['url']?.toString() ?? ''),
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const Center(
                  child: Icon(Icons.broken_image_outlined, color: Colors.white54, size: 48),
                ),
              ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                onPressed: () => Navigator.pop(ctx),
                icon: const Icon(Icons.close, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _faixaFotos(List<dynamic> fotos) {
    if (fotos.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 10),
        Text(
          '${fotos.length} foto${fotos.length > 1 ? 's' : ''} do serviço',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 72,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: fotos.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) => GestureDetector(
              onTap: () => _verFoto(fotos, i),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  Config.urlMidia(fotos[i]['url']?.toString() ?? ''),
                  width: 72,
                  height: 72,
                  fit: BoxFit.cover,
                  loadingBuilder: (_, child, progress) {
                    if (progress == null) return child;
                    return Container(
                      width: 72,
                      height: 72,
                      alignment: Alignment.center,
                      color: MinutaskCores.superficie,
                      child: const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    );
                  },
                  errorBuilder: (_, __, ___) => Container(
                    width: 72,
                    height: 72,
                    color: MinutaskCores.superficie,
                    child: const Icon(Icons.broken_image_outlined),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _badge(String texto, Color cor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: cor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: cor.withValues(alpha: 0.35)),
      ),
      child: Text(
        texto,
        style: TextStyle(color: cor, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }

  void _abrirMenu() {
    MenuLogoSheet.mostrar(
      context,
      api: widget.api,
      online: _online,
      onAlternarOnline: _alternarOnline,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: C9Fundo(
        variante: MinutaskVariante.trabalhador,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: Colors.transparent,
              title: LogoMinutask(
                variante: MinutaskVariante.trabalhador,
                tamanho: 32,
                mostrarIndicadorMenu: true,
                onTap: _abrirMenu,
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  Text(
                    'Ofertas',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(fontSize: 28),
                  ),
                  const SizedBox(height: 16),
                  C9Card(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            gradient: MinutaskCores.gradienteMarca(
                              MinutaskVariante.trabalhador,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            _online ? Icons.wifi_tethering : Icons.wifi_tethering_off,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _online ? 'Online' : 'Offline',
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              Text(
                                _online
                                    ? 'Recebendo microjobs'
                                    : 'Ative para ver ofertas',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: _online,
                          onChanged: _alternarOnline,
                          activeColor: MinutaskCores.ciano,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (!_online)
                    C9Card(
                      child: Column(
                        children: [
                          Icon(
                            Icons.notifications_none_rounded,
                            size: 48,
                            color: MinutaskCores.textoMuted,
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Fique online para receber ofertas',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    )
                  else if (_ofertas.isEmpty)
                    C9Card(
                      child: const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Text('Aguardando novos microjobs...'),
                        ),
                      ),
                    )
                  else
                    ..._ofertas.map((o) {
                      final valor = o['valor_publicado'] ?? o['valor_sugerido'] ?? 0;
                      final fotos = o['fotos'] as List? ?? [];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: C9Card(
                          hoverGlow: true,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  _badge('URGENTE', MinutaskCores.alerta),
                                  const SizedBox(width: 6),
                                  _badge('MICROJOB', MinutaskCores.verde),
                                  const Spacer(),
                                  Text(
                                    'R\$ $valor',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                      color: MinutaskCores.ciano,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                o['descricao']?.toString() ?? '',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (FormatoData.agendadoDeIso(o['agendado_para']).isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.event_outlined,
                                      size: 16,
                                      color: MinutaskCores.ciano.withValues(alpha: 0.85),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      FormatoData.agendadoDeIso(o['agendado_para']),
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 6),
                              Text(
                                'Valor inicial — negociável no chat',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              _faixaFotos(fotos),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: () => _recusar(o['id'] as int),
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: Colors.redAccent,
                                        side: const BorderSide(color: Colors.redAccent),
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                      ),
                                      child: const Text('Recusar'),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    flex: 2,
                                    child: DecoratedBox(
                                      decoration: BoxDecoration(
                                        gradient: MinutaskCores.gradienteMarca(
                                          MinutaskVariante.trabalhador,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Material(
                                        color: Colors.transparent,
                                        child: InkWell(
                                          onTap: () => _aceitar(o),
                                          borderRadius: BorderRadius.circular(12),
                                          child: const Padding(
                                            padding: EdgeInsets.symmetric(vertical: 12),
                                            child: Center(
                                              child: Text(
                                                'Aceitar',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
