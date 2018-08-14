# FLUTTER VIEW

A tool for creating Flutter views in dart code using html and css. It searches for pug or html files in a directory you pass, and uses it to generate Dart functions that build a tree of flutter widgets. You can also use css or sass to set properties of these widgets.

Flutter view has support for ScopedModel and makes it possible to create a reactive application. It does not force you to use ScopedModel but proposes a way to create applications with it.

## Requirements

A working Typescipt install (install using *npm install -g typescript*)

## Installing

You need 

1. clone this repository
2. change to the project directory
3. * npm install*
4. *npm link*

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

## Creating Views

*For the examples from here on we will use pug and sass, but you can also use html and css.*

To create your own views, create a pug file or html file. Flutter-view will detect your file when you run it or when it is watching, and will automatically create the dart file of the same name. 

### A simple view

A single file can contain multiple flutter-views. You create a view like this (test.pug):

```pug
	greeting-message(flutter-view)
		| hello world!
```

The *flutter-view* property identifies **greeting-message** as a flutter-view to be processed into a method.

This will create the following dart code:

```dart
Text GreetingMessage() {
  return Text(
    'hello world!'
  );
}
```

As you see, flutter-view creates a function that lets you create a tree of widgets. You can now import the generated test.dart file in your other code and call it, for example:

```dart
Container(child: GreetingMessage())
```

*side note: the reason flutter-view generates methods that start with an uppercase, is that in practice, you will use these functions like widgets, and this way they behave like that when you build your code.*

Some things to note:

- the tag with the flutter-view property must be a top level tag, ie: it must not be indented or be the child of another tag.
- html and pug code tags must be dash-cased. The resulting dart code will be camel-cased.
- text is automatically wrapped in a Text widget. The class to be used can be overridden with flutter-view.json. 
- #ids and .classes in pug or html are converted to **Container**s.

### Adding parameters

You can add parameters to your flutter view, letting you use them to build your widget tree. For example:

```pug
greeting-message(flutter-view :name)
	| Hello $name!
```

will render as:

```dart
Text GreetingMessage({ @required name }) {
  return Text(
    'Hello $name!'
  );
}
```

so now you can use it like this:

```dart
Container(child: GreetingMessage(name: 'my friend'));
```

You can use these parameters to pass down widgets as well, or handlers:

```pug
greeting-message(flutter-view :name :on-close)
	| Hello $name!
	raised-button(@on-pressed='onClose()') close
```

You can now pass down the onClose closure as a parameter:

```dart
Container(
	child: GreetingMessage(
		name: 'my friend',
		onClose: () { print("closed dialog"); }
	)
);
```

This way, parameters allow you to both pass down information, and pass up information based on interactions.

Some notes:

- in the html and pug, always use dash-cased instead of camel case, except for in string values.

### Parameter types

### Expression parameters

If you put : in front of a parameter, it is not taken as a string value, but is taken as an expression to put in the code literally.

For example, 

```pug
container(width='300.0') Hello
```

This will not work, since it will assign the literal string 300 to the width property of the container class, which expects a double.

To solve this, pass it as an expression property:

```pug
container(:width='300.0') Hello
```

Now the quotes are stripped from '300.0', and width will be set to 300.0.

#### Closure parameters

In the above example, you saw a parameter being passed with @ in front of it: **@on-pressed='onClose()'**.

If you put @ in front of a parameter, it will be wrapped in a no-parameter closure. These are equal:

```pug
flat-button(@on-pressed='myHandler()')
flat-button(:on-pressed='() { myHandler() }')
```
and you could also pass the reference instead:

```pug
flat-button(:on-pressed='myHandler')
```

Prefer the @parameter handler when there are no parameters for your closure, because it is more descriptive.

### Calling other widgets

As you saw already with the last example, we are creating a FlatButton, which is a flutter widget. You create widgets in your pug file by simply calling the widgets by name, in dash-case.

However some widgets take other widgets or class instances as parameters, which would not fit in normal properties.

By default, child tags of tags are added as the *child* property or as members of the *children* array property of tags.

By adding *as='...'* to children of a tag, they are set as that property of their parent.

For example: 

```pug
test-app(flutter-view)
	material-app(title='Flutter Demo')
		scaffold(as='home')
			app-bar(as='appBar')
				#title(as='title') Flutter Demo
			center(as='body') Hello world!
```

This will create a function called TestApp that returns a full scaffold:

```dart
MaterialApp TestApp() {
  return MaterialApp(
    title: 'Flutter Demo!',
    home: Scaffold(
      appBar: AppBar(
        title: Container(
          child: Text(
            'Welcome'
          )
        )
      ),
      body: Center(
        child: Text(
          'Hello world!'
        )
      )
    )
  );
}
```

Tags that have *as* as a property, are placed as the child of that name of their parent, allowing you to build any widget structure.






## How it works

Flutter-view searches for css, sass, html and pug files in the directory you passed, and all of its subdirectories. For any html or pug file encountered, flutter-view looks for a sass or css file of the same name. 

It then tries to merge the two internally, creating a single html tree of elements with style tags. These style tags are converted into properties. For example given this html:

```html
	<div style="width: 300.0"></div>
```

Is treated like:

```html
	<div width=300.0></div>
```

It actually converts it into a json tree like this:

```json
	{
		class: "widget",
		name: "Container",
		params: [
			{
				class: 'param',
				type: 'expression',
				name: 'width',
				value: '300.0'
			}
		]
	}
```

This json tree is passed through a list of plugins, and the resulting tree is passed into the renderer, which ends up with dart code:

```dart
	Container(
		width: 300.0
	)
```

