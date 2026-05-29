import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../componentes/c9_fundo.dart';
import '../core/config.dart';
import '../servicos/api_service.dart';
import '../tema/app_theme.dart';

class ChatTela extends StatefulWidget {
  final ApiService api;
  final int tarefaId;
  final String titulo;

  const ChatTela({
    super.key,
    required this.api,
    required this.tarefaId,
    required this.titulo,
  });

  @override
  State<ChatTela> createState() => _ChatTelaState();
}

class _ChatTelaState extends State<ChatTela> {
  final _texto = TextEditingController();
  final _scroll = ScrollController();
  List<Map<String, dynamic>> _mensagens = [];
  String? _outroNome;
  bool _podeEnviar = true;
  bool _carregando = true;
  bool _enviando = false;
  double? _valorVigente;
  WebSocketChannel? _canal;
  Timer? _polling;

  @override
  void initState() {
    super.initState();
    _iniciar();
  }

  @override
  void dispose() {
    _canal?.sink.close();
    _polling?.cancel();
    _texto.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _iniciar() async {
    try {
      final resumo = await widget.api.resumoChat(widget.tarefaId);
      final msgs = await widget.api.listarMensagens(widget.tarefaId);
      if (!mounted) return;
      setState(() {
        _outroNome = resumo['outro_nome']?.toString();
        _podeEnviar = resumo['pode_enviar'] == true;
        _valorVigente = (resumo['valor_vigente'] as num?)?.toDouble();
        _mensagens = msgs;
        _carregando = false;
      });
      _conectarWs();
      _polling = Timer.periodic(const Duration(seconds: 4), (_) => _atualizarMensagens());
      _rolarFim();
    } catch (e) {
      if (!mounted) return;
      setState(() => _carregando = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _atualizarResumo() async {
    final resumo = await widget.api.resumoChat(widget.tarefaId);
    if (!mounted) return;
    setState(() {
      _valorVigente = (resumo['valor_vigente'] as num?)?.toDouble();
      _podeEnviar = resumo['pode_enviar'] == true;
    });
  }

  void _conectarWs() {
    _canal = WebSocketChannel.connect(Uri.parse(Config.wsTarefa(widget.tarefaId)));
    _canal!.stream.listen((raw) {
      final dados = jsonDecode(raw as String) as Map<String, dynamic>;
      if (dados['evento'] != 'chat_mensagem') return;
      _atualizarMensagens();
      _atualizarResumo();
    });
  }

  Future<void> _atualizarMensagens() async {
    try {
      final msgs = await widget.api.listarMensagens(widget.tarefaId);
      if (!mounted) return;
      setState(() => _mensagens = msgs);
      _rolarFim();
    } catch (_) {}
  }

  void _rolarFim() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _enviar() async {
    final txt = _texto.text.trim();
    if (txt.isEmpty || !_podeEnviar || _enviando) return;
    setState(() => _enviando = true);
    try {
      await widget.api.enviarMensagem(widget.tarefaId, txt);
      _texto.clear();
      await _atualizarMensagens();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Future<void> _dialogProporValor() async {
    final ctrl = TextEditingController(
      text: _valorVigente != null ? _valorVigente!.toStringAsFixed(0) : '',
    );
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: MinutaskCores.superficie,
        title: const Text('Propor valor'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Combine um valor com o contratante. Ele precisa aceitar no chat.',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Valor (R\$)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Enviar proposta')),
        ],
      ),
    );
    if (ok != true) return;
    final valor = double.tryParse(ctrl.text.replaceAll(',', '.'));
    if (valor == null || valor <= 0) return;
    try {
      await widget.api.proporValor(widget.tarefaId, valor);
      await _atualizarMensagens();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _responderProposta(int msgId, bool aceitar) async {
    try {
      await widget.api.responderProposta(widget.tarefaId, msgId, aceitar);
      await _atualizarMensagens();
      await _atualizarResumo();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Widget _bannerPagamento() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: MinutaskCores.ciano.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: MinutaskCores.ciano.withValues(alpha: 0.3)),
      ),
      child: Text(
        'Pagamento somente após concluir o serviço, pela Minutask. '
        'Não solicite adiantamento ao contratante.',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              height: 1.35,
              fontWeight: FontWeight.w500,
            ),
      ),
    );
  }

  Widget _bolha(Map<String, dynamic> m) {
    final tipo = m['tipo']?.toString() ?? 'texto';

    if (tipo == 'sistema') {
      return Center(
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.92),
          decoration: BoxDecoration(
            color: MinutaskCores.superficie.withValues(alpha: 0.7),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: MinutaskCores.borda),
          ),
          child: Text(
            m['texto']?.toString() ?? '',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(height: 1.35),
          ),
        ),
      );
    }

    if (tipo == 'proposta_valor') {
      final minha = m['minha'] == true;
      final status = m['proposta_status']?.toString();
      final pendente = status == 'pendente';
      return Align(
        alignment: minha ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
          decoration: BoxDecoration(
            color: MinutaskCores.ciano.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: MinutaskCores.ciano.withValues(alpha: 0.35)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Proposta de valor', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
              const SizedBox(height: 4),
              Text(m['texto']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
              if (status != null && status != 'pendente')
                Text(
                  status == 'aceita' ? 'Aceita' : 'Recusada',
                  style: TextStyle(
                    color: status == 'aceita' ? MinutaskCores.verde : Colors.redAccent,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              if (pendente && !minha) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _responderProposta(m['id'] as int, false),
                        child: const Text('Recusar'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: FilledButton(
                        onPressed: () => _responderProposta(m['id'] as int, true),
                        child: const Text('Aceitar'),
                      ),
                    ),
                  ],
                ),
              ],
              if (pendente && minha)
                const Text('Aguardando resposta...', style: TextStyle(fontSize: 11)),
            ],
          ),
        ),
      );
    }

    final minha = m['minha'] == true;
    return Align(
      alignment: minha ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          gradient: minha ? MinutaskCores.gradienteMarca(MinutaskVariante.trabalhador) : null,
          color: minha ? null : MinutaskCores.superficie.withValues(alpha: 0.85),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: Radius.circular(minha ? 14 : 4),
            bottomRight: Radius.circular(minha ? 4 : 14),
          ),
          border: minha ? null : Border.all(color: MinutaskCores.borda),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!minha)
              Text(
                m['remetente_nome']?.toString() ?? '',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: MinutaskCores.ciano.withValues(alpha: 0.9),
                ),
              ),
            Text(
              m['texto']?.toString() ?? '',
              style: TextStyle(color: minha ? Colors.white : MinutaskCores.texto, height: 1.35),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: C9Fundo(
        variante: MinutaskVariante.trabalhador,
        child: Column(
          children: [
            SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 4),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _outroNome ?? 'Contratante',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                          ),
                          Text(widget.titulo, maxLines: 1, overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall),
                          if (_valorVigente != null)
                            Text(
                              'Valor vigente: R\$ ${_valorVigente!.toStringAsFixed(2)}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: MinutaskCores.ciano,
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (_podeEnviar)
                      IconButton(
                        onPressed: _dialogProporValor,
                        icon: const Icon(Icons.payments_outlined),
                      ),
                  ],
                ),
              ),
            ),
            _bannerPagamento(),
            Expanded(
              child: _carregando
                  ? const Center(child: CircularProgressIndicator(color: MinutaskCores.ciano))
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: _mensagens.length,
                      itemBuilder: (_, i) => _bolha(_mensagens[i]),
                    ),
            ),
            if (_podeEnviar)
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _texto,
                          maxLines: 3,
                          minLines: 1,
                          onSubmitted: (_) => _enviar(),
                          decoration: InputDecoration(
                            hintText: 'Mensagem...',
                            filled: true,
                            fillColor: MinutaskCores.superficie.withValues(alpha: 0.8),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: _enviando ? null : _enviar,
                        style: IconButton.styleFrom(
                          backgroundColor: MinutaskCores.ciano,
                          foregroundColor: MinutaskCores.fundo,
                        ),
                        icon: _enviando
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.send_rounded),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
