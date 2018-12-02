# FLUTTER-VIEW

https://flutter-view.io

Flutter-view is a tool that makes writing reactive [Flutter](http://flutter.io) layouts a breeze. It lets you use [Pug](http://pugjs.org) and [Sass](http://sass-lang.com) \(or HTML and CSS if you prefer\) to generate the Flutter Dart code that renders the views in your app.

You use it by running the `flutter-view` command in your terminal to let it monitor your project. When it detects changes in a Pug, HTML, Sass or CSS file, it automatically generates or updates a matching Dart file.

## Why views in Flutter

In standard Flutter Dart code, the "state" of your application is mixed in with the presentation. This can make it hard to structure your code well.

Flutter-view is about creating **views**, which are functions that return a widget tree for presenting something. These functions act a bit like components. Flutter-view uses **Pug** to make layouts more terse and **Sass** to let you style faster and more easily. The state part comes into play when you make your view **reactive**. You can pass models (or streams) into your views. When these models change, the views automatically adapt.

## Creating a view

A single flutter-view generates a Dart function that usually returns a widget tree. You can either use Pug or HTML:

Pug:
```pug
hello(flutter-view)
    .greeting Hello world!
```

HTML:
```markup
<hello flutter-view>
    <div class="greeting">
        Hello world!
    </div>
</hello>
```

Generated Dart:
```dart
Container Hello() {
    return Container(
        child: Text("Hello world!")
    );
}
```

This generated function can be used like any other Dart code, and will return the code that gives the greeting.

## Adding Styling

You can add Sass/CSS to styles to your view. Flutter-view contains plugins that take your CSS properties and convert them into code. For our example, you can easily add a text color, background color, some font properties, and add padding:

Pug:
```pug
hello(flutter-view)
    .greeting Hello world!
```

Sass:
```sass
.greeting
    color: red
    background-color: grey[200]
    text-transform: uppercase
    padding: 10 20
```

Generated Dart:
```dart
Hello() {
    return DefaultTextStyle.merge(
        style: TextStyle(
            color: Colors.red
        ),
        child: Container(
            decoration: BoxDecoration(
                color: Colors.grey[200]
            ),
            padding: EdgeInsets.only(
                top: 10,
                right: 20,
                bottom: 10,
                left: 20
            ),
            child: Text("Hello world!".toUpperCase),
        )
    );
}
```

Flutter-view supports many CSS properties, and makes it easy to change styles and immediately see the effect. Since single CSS rules can apply to many elements, small CSS changes may have big code effects.

You can also fully leverage both Pug and Sass mixin and function support, allowing for some powerful patters, such as different styling based on running Android or iOS.

## Making it Reactive

Flutter-view does not force you into any particular Reactive model. For example it works well with streams. However, it comes with native [ScopedModel ](https://pub.dartlang.org/packages/scoped_model)support and a [small Dart support library](https://pub.dartlang.org/packages/flutter_view_tools) for terse reactive coding:

user.dart:

```dart
class User extends Model {
    User({this.name, this.age});

    String name;
    int age;
}
```

hello.pug:

```pug
hello(flutter-view :user)
    reactive(watch='user')
        .greeting Hello ${user.name}!
```

generated hello.dart:

```dart
Widget Hello({user}) {
    return ReactiveWidget(
        watch: user as Listenable,
        builder: (context, $) {
            return Container(
                child: Text("Hello ${user.name}!")
            )
        },
    );
}
```

The view now takes a User as a parameter and watches it for changes. Now when we change the the user name and call  `user.notifyListeners()`,  the view will automatically update.

## Requirements

- Flutter
- A working Typescipt installation (install using *npm install -g typescript*)

## Getting Started

In your terminal of choice type:

	npm install -g flutter-view

*Note: you may need to add **--unsafe-perm** for things to work due to an [issue
with node-gyp](https://github.com/nodejs/node-gyp/issues/454)*

## Building Locally

Steps to build the project locally:

1. clone this repository
2. change to the project directory
3. *npm install*
4. *tsc*
5. *npm link*

Typing *flutter-view* in any directory should now work.

## Usage

In a terminal, go into the directory of your Flutter project, and type *flutter-view -w lib*. This should start the tool watching on your lib directory.

In general, use is as follows:

	> flutter-view [-w] <directory>

You can use the following flags:

	-V, --version        output the version number
    -w, --watch          Watch for changes
    -c, --config <file>  Optional config file to use (default: flutter-view.json)
    -h, --help           output usage information

# Full documentation

For a guide and reference to the pug and sass styles, check the [online documentation](https://flutter-view.gitbook.io/project/)
