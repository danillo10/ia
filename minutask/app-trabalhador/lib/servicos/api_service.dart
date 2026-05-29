import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config.dart';
import 'sessao_armazenamento.dart';

class ApiService {
  final _armazenamento = SessaoArmazenamento();
  String? _token;
  int? usuarioId;
  Map<String, dynamic>? usuario;

  void definirSessao(String token, int id, {Map<String, dynamic>? usuario}) {
    _token = token;
    usuarioId = id;
    this.usuario = usuario;
  }

  Future<void> persistirSessao({String? email, String? senha}) async {
    if (_token == null || usuarioId == null || usuario == null) return;
    await _armazenamento.salvar(_token!, usuario!);
    if (email != null && senha != null) {
      await _armazenamento.salvarCredenciais(email, senha);
    }
  }

  Future<void> limparSessao() async {
    _token = null;
    usuarioId = null;
    usuario = null;
    await _armazenamento.limpar();
  }

  Future<bool> restaurarSessaoSalva({required String papelEsperado}) async {
    final salva = await _armazenamento.carregar();
    if (salva == null) return false;

    definirSessao(
      salva.token,
      salva.usuario['id'] as int,
      usuario: salva.usuario,
    );

    try {
      final perfil = await obterEu();
      if (perfil['papel']?.toString() != papelEsperado) {
        await limparSessao();
        return false;
      }
      definirSessao(salva.token, perfil['id'] as int, usuario: perfil);
      await persistirSessao();
      return true;
    } catch (_) {
      await limparSessao();
      return false;
    }
  }

  Future<Map<String, dynamic>> obterEu() async {
    final res = await http.get(
      Uri.parse('${Config.apiBase}/auth/eu'),
      headers: _headers,
    );
    if (res.statusCode == 401) {
      throw Exception('Sessão expirada');
    }
    final body = _decodificar(res);
    if (res.statusCode >= 400) {
      throw Exception(_mensagemErro(res.statusCode, body));
    }
    return Map<String, dynamic>.from((body as Map)['usuario'] as Map);
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  String _mensagemErro(int status, dynamic body) {
    if (body is Map && body['detail'] != null) {
      final d = body['detail'];
      if (d is String) return d;
    }
    return 'Erro HTTP $status';
  }

  dynamic _decodificar(http.Response res) {
    if (res.body.isEmpty) throw Exception('Servidor sem resposta');
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> entrar(String email, String senha) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/auth/entrar'),
      headers: _headers,
      body: jsonEncode({'email': email, 'senha': senha}),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }

  Future<void> definirOnline(bool online, {double? lat, double? lon}) async {
    await http.put(
      Uri.parse('${Config.apiBase}/trabalhador/status-online'),
      headers: _headers,
      body: jsonEncode({
        'online': online,
        if (lat != null) 'lat': lat,
        if (lon != null) 'lon': lon,
      }),
    );
  }

  Future<List<dynamic>> listarDisponiveis() async {
    final res = await http.get(
      Uri.parse('${Config.apiBase}/trabalhador/tarefas/disponiveis'),
      headers: _headers,
    );
    if (res.statusCode >= 400) return [];
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<void> aceitar(int tarefaId) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/trabalhador/tarefas/$tarefaId/aceitar'),
      headers: _headers,
    );
    if (res.statusCode == 409) throw Exception('Outro trabalhador já aceitou');
    if (res.statusCode >= 400) {
      final body = _decodificar(res);
      throw Exception(_mensagemErro(res.statusCode, body));
    }
  }

  Future<void> recusar(int tarefaId) async {
    await http.post(
      Uri.parse('${Config.apiBase}/trabalhador/tarefas/$tarefaId/recusar'),
      headers: _headers,
    );
  }

  Future<List<Map<String, dynamic>>> listarMensagens(int tarefaId) async {
    final res = await http.get(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/mensagens'),
      headers: _headers,
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return (body as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> enviarMensagem(int tarefaId, String texto) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/mensagens'),
      headers: _headers,
      body: jsonEncode({'texto': texto}),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> resumoChat(int tarefaId) async {
    final res = await http.get(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/resumo'),
      headers: _headers,
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> proporValor(int tarefaId, double valor) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/propor-valor'),
      headers: _headers,
      body: jsonEncode({'valor': valor}),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }

  Future<Map<String, dynamic>> responderProposta(
    int tarefaId,
    int mensagemId,
    bool aceitar,
  ) async {
    final res = await http.post(
      Uri.parse('${Config.apiBase}/chat/tarefas/$tarefaId/propostas/$mensagemId/responder'),
      headers: _headers,
      body: jsonEncode({'aceitar': aceitar}),
    );
    final body = _decodificar(res);
    if (res.statusCode >= 400) throw Exception(_mensagemErro(res.statusCode, body));
    return Map<String, dynamic>.from(body as Map);
  }
}
