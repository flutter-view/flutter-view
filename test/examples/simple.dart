import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_platform_widgets/flutter_platform_widgets.dart';
import 'package:scoped_model/scoped_model.dart';
class SimplePage extends StatelessWidget {
  final page;
  SimplePage(this.page);
  @override
  Widget build(BuildContext context) {
    return
    PlatformScaffold(
      appBar: const PlatformAppBar(
        title: const Container(
          height: page.titleHeight,
          child: const Text(
            '${page.title}'
          )
        )
      ),
      body: const Container(
        child: const Column(
          children: [
            Text(
              'Welcome ${page.firstName}!'
            ),
            Container(
              child: const Text(
                'Hello'
              )
            ),
            Container(
              decoration: const BoxDecoration(
                border: Border.all(width: 1.0)
              ),
              child: const PlatformButton(
                onPressed: page.tapped,
                child: const Text(
                  'Click me!!!'
                )
              )
            )
          ]
        )
      )
    );
  }
}