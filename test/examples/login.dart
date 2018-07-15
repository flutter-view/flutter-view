import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_platform_widgets/flutter_platform_widgets.dart';
import 'package:scoped_model/scoped_model.dart';
class LoginPage extends StatelessWidget {
  final model;
  LoginPage(this.model);
  @override
  Widget build(BuildContext context) {
    return
    PlatformScaffold(
      appBar: const PlatformAppBar(
        title: const Container(
          child: const Text(
            'Login'
          )
        )
      ),
      body: const ListView(
        children: [
          Center(
            child: const Container(
              decoration: const BoxDecoration(
                image: const DecorationImage(
                  fit: BoxFit.contain,
                  image: const AssetImage(
                    'images/icon.img'
                  )
                )
              )
            )
          ),
          ScopedModel(
            model: model,
            child: const Material(
              color: Colors.white,
              child: const Padding(
                padding: const EdgeInsets.only(top: 120.0),
                child: const Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: const TextField(
                            controller: model.loginUserName,
                            autocorrect: false,
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              hintText: 'Username'
                            )
                          )
                        )
                      ]
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: const TextField(
                            controller: model.loginPassword,
                            autocorrect: false,
                            obscureText: true,
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              hintText: 'Password'
                            )
                          )
                        )
                      ]
                    ),
                    PlatformButton(
                      onPressed: model.login
                    ),
                    PlatformText(
                      'model.loginErrorMessage',
                      style: const TextStyle(
                        color: Colors.redAccent
                      )
                    )
                  ]
                )
              )
            )
          )
        ]
      )
    );
  }
}