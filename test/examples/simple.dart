
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
      height: '30',
      size: '400',
      appBar: PlatformAppBar(
        title: Container(
          height: page.titleHeight,
          child: PlatformText(
            '${page.title}'
          )
        )
      ),
      body: Container(
        cols: '50',
        child: Column(
          title: ''Hello there!'',
          children: [
            PlatformText(
              'Welcome ${page.firstName}!'
            ),
            Container(
              child: PlatformText(
                'Hello'
              )
            ),
            Container(
              decoration: BoxDecoration(
                border: Border.all(width: 1.0)
              ),
              child: PlatformButton(
                onPressed: page.tapped,
                child: PlatformText(
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