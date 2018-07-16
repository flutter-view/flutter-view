
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_platform_widgets/flutter_platform_widgets.dart';
import 'package:scoped_model/scoped_model.dart';

class TestPage extends StatelessWidget {

  final model;

  TestPage(this.model);

  @override
  Widget build(BuildContext context) {
    return
    PlatformScaffold(
      appBar: PlatformAppBar(
        title: Container(
          child: PlatformText(
            'Login'
          )
        ),
        body: ListView(
          children: [
            Center(
              height: '50',
              children: [
                Container(
                  decoration: BoxDecoration(
                    image: AssetImage(
                      ''images/icon.img''
                    )
                  )
                ),
                Container(
                  child: PlatformText(
                    'Hello world!'
                  )
                )
              ]
            )
          ]
        )
      )
    );
  }

}