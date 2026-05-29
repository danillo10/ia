import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Persiste token e perfil entre aberturas do app.
class SessaoArmazenamento {
  static const _tokenKey = 'minutask_contratante_token';
  static const _usuarioKey = 'minutask_contratante_usuario';
  static const _emailKey = 'minutask_contratante_email';
  static const _senhaKey = 'minutask_contratante_senha';

  Future<void> salvar(String token, Map<String, dynamic> usuario) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_usuarioKey, jsonEncode(usuario));
  }

  Future<({String token, Map<String, dynamic> usuario})?> carregar() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final usuarioJson = prefs.getString(_usuarioKey);
    if (token == null || token.isEmpty || usuarioJson == null) return null;
    try {
      final usuario = Map<String, dynamic>.from(jsonDecode(usuarioJson) as Map);
      final id = usuario['id'];
      if (id is! int) return null;
      return (token: token, usuario: usuario);
    } catch (_) {
      return null;
    }
  }

  Future<void> salvarCredenciais(String email, String senha) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_emailKey, email);
    await prefs.setString(_senhaKey, senha);
  }

  Future<({String email, String senha})?> carregarCredenciais() async {
    final prefs = await SharedPreferences.getInstance();
    final email = prefs.getString(_emailKey);
    final senha = prefs.getString(_senhaKey);
    if (email == null || email.isEmpty || senha == null) return null;
    return (email: email, senha: senha);
  }

  Future<void> limpar() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_usuarioKey);
  }
}
