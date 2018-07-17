import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_platform_widgets/flutter_platform_widgets.dart';
import 'package:scoped_model/scoped_model.dart';
import 'package:testerdertest';

class SimplePage extends StatelessWidget {

  final page;
  final user;

  SimplePage(this.page, this.user);

  @override
  Widget build(BuildContext context) {
    return
    PlatformScaffold(
      height: 30,
      size: 400,
      appBar: PlatformAppBar(
        title: Container(
          height: page.titleHeight,
          child: const PlatformText(
            '${page.title}'
          )
        )
      ),
      body: Container(
        cols: 50,
        child: const Column(
          title: 'Hello there!',
          children: [
            const PlatformText(
              'Welcome ${page.firstName}!'
            ),
            Container(
              child: const PlatformText(
                'Hello'
              )
            ),
            Container(
              decoration: const BoxDecoration(
                border: 'Border.all(width: 1.0)'
              ),
              child: const PlatformButton(
                onPressed: page.tapped,
                child: const PlatformText(
                  'Click me!!!'
                )
              )
            ),
            Container(
              child: user
            )
          ]
        )
      )
    );
  }

}