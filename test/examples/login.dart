import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_platform_widgets/flutter_platform_widgets.dart';
import 'package:scoped_model/scoped_model.dart';

class LoginPage extends StatelessWidget {



  LoginPage();

  @override
  Widget build(BuildContext context) {
    return
    PlatformScaffold(
      appBar: PlatformAppBar(
        title: Container(
          child: PlatformText(
            'Login'
          )
        )
      ),
      body: ListView(
        children: [
          Center(
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  fit: BoxFit.contain,
                  image: AssetImage(
                    'images/icon.img'
                  )
                )
              )
            )
          ),
          Material(
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.only(top: 120.0),
              child: Column(
                vModel: 'model',
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: model.loginUserName,
                          autocorrect: false,
                          decoration: InputDecoration(
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
                        child: TextField(
                          controller: model.loginPassword,
                          autocorrect: false,
                          obscureText: true,
                          decoration: InputDecoration(
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
                    style: TextStyle(
                      color: Colors.redAccent
                    )
                  )
                ]
              )
            )
          )
        ]
      )
    );
  }

}