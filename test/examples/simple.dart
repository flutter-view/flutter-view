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
      appBar: PlatformAppBar(
        title: Container(
          height: page.titleHeight,
          child: Text(
            '${page.title}'
          )
        )
      ),
      body: Container(
        child: Column(
          children: [
            Text(
              'Welcome ${page.firstName}!'
            ),
            Container(
              child: Text(
                'Hello'
              )
            ),
            Container(
              decoration: BoxDecoration(
                border: Border.all(width: 1.0)
              ),
              child: PlatformButton(
                onPressed: page.tapped,
                child: Text(
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