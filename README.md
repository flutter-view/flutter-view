# FLUTTER VIEW

A tool for creating Flutter views in dart code using html and css. It searches for pug or html files in a directory you pass, and uses it to generate Dart functions that build a tree of flutter widgets. You can also use css or sass to set properties of these widgets.

Flutter view has support for ScopedModel and makes it possible to create a reactive application. It does not force you to use ScopedModel but proposes a way to create applications with it.

## Requirements

A working Typescipt install (install using *npm install -g typescript*)

## Installing

You need 

1. clone this repository
2. change to the project directory
3. *npm install*
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
- To show the name in a string, we are using normal Dart string interpolation: $name. This means that single parameters can use $param, and if you want to traverse to a property use the Dart ${param.property} notation. For example, if you have a class User with a property name, you could pass the name as ${user.name}.

### Parameter types

#### Expression parameters

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

#### Passing complex properties

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

#### Setting generic types

If a widget is generic, that is, if you need to pass a generic parameter, you can do so with the *v-type* property. The value of the property is the name of the generic parameter. If there are multiple generic parameters, pass them both as the value, separated by a comma.

For example:

```pug
scoped-model(v-type='UserModel' :model='myModel')
	...
```

This will create the following Dart code:

```dart
ScopedModel<UserModel>(
    model: myModel,
    child: ...
)
```

#### Calling different constructors

Normally using a Dart class name in a flutter-vuew in dash-case will create that class.

```pug
list-view(:shrink-wrap='true')
```

will generate this Dart code:

```dart
ListView(shrinkWrap=true)
```

However, there are cases where you need to call a specific named constructor, like **ListView.builder()**.

In that case, you can use the *v-constructor* property, which you set to the name of the constructor.

```pug
list-view(v-constructor='builder' :shrink-wrap='true')
```

will generate:

```dart
ListView.builder(shrinkWrap=true)
```

### Passing functions

Some widgets require a function to be passed. A very common example in Flutter is a builder function, which simply needs to return a new tree of widgets. To create a function, you use the **function** tag. It requires a *params* property, which is a string that lists the parameters your function receives, separated by commas.

For example, to implement ScopedModelDescendant:

```pug
scoped-model-descendant(v-type='UserModel')
	function(as='builder' params='(context, widget, model')
		...
```

This will create this Dart code:

```dart
ScopedModelDescendant<UserModel>(
	builder: ((context, widget, model) {
		return ...
	}
)
```

### Passing arrays

Sometimes you need to pass an array of widgets or complex objects as a property. In that case you can use the **array** tag. All children of the array tag become values in the array, and you can use the *as* property to assign the array as a parent property.

For example, you can set up a BottomNavigationBar like this:

```pug
bottom-navigation-bar(:current-index='currentTab')
	array(as='items')
		bottom-navigation-bar-item(:icon='Icon(Icons.home)')
			.title(as='title') Home
		bottom-navigation-bar-item(:icon='Icon(Icons.mail)')
			.title(as='title') Messages
		bottom-navigation-bar-item(:icon='Icon(Icons.person)')
			.title(as='title') Profile
```

Here each **BottomNavigationBar** is created as an entry of an array and put in the *items* property of the BottomNavigationBar.

### Passing single items

Sometimes you want to insert a single item into a tree of widgets, by value. This means you do not yet know the tag you will insert, so you can not use the *as* property.

For example, to put a widget parameter into a position:

```pug
user-card(flutter-view :user :add-to-bottom)
	column.user-card
		row.name ${user.name}
		row.company ${user.company}
		slot(:value='addToBottom)
```

Here any widget that is passed to the **UserCard.addToBottom** parameter will be added in the position of the slot.

Since slot picks the first value from its children, you can also use this as a switch. For example:

```pug
material-app(title='My App' :currentPage)
	theme-data(as='theme')
	slot(as='home')
		home-page(v-if='currentPage=="home"')
		profile-page(v-if='currentPage=="profile"')
```

In the above example, the currentPage property will switch between the homepage and the profilepage.

### Conditionals

By passing the reserved **v-if** property in a tag, you make it conditional on an expression.

For example, the below code will only show the even-message container if the passed count is an even number.

```pug
show-counter(flutter-view :count)
	.counter $count
	.even-message(v-if='count.isEven') it is even
	.odd-message(v-if='!count.isEven') it is odd
```

### Looping and Iteration

By passing the reserved **v-for** property in a tag, you can loop through a list of values and repeat the tag and all of its children for each value in the list.

For example, this code will show all names being passed:

```pug
show-names(flutter-view :names)
	.names
		.name(v-for='name in names') $name
```

To use, simple pass a list:

```dart
ShowNames(names: ['James', 'Mary', 'John'])
```

### Importing dart files

Since you will want to call other widgets from your views, you will need to import them. You can import with the **import** tag. Pass the package to import with the package property. All imports should be at the top of your html or pug file. For example:

```pug
import(package='flutter_platform_widgets/flutter_platform_widgets.dart')
import(package='scoped_model/scoped_model.dart')
```

## Styling Views

You can add styling to your views by adding a .css or .sass file of the same name in the same directory as your .pug or .html file.

### Adding ids and classes to your pug/html

Styles will match based on the names of tags or classes and ids you add to your html/pug code.

For example, consider the following view:

```pug
show-names(flutter-view :names)
	#name-entries
		.name-entry(v-for='name in names') $name
```

Here *#name-entries* is an *id* and *.name-entry* is a *class*. This information will be lost once dart code is generated. 

If you use pug and you do not provide a tag with an *id* or *class*, the *id* or *class* will be represented by a **Container()**.

```pug
.test //- results in Container()
button.test //- results in Button()

#test //- results in Container()
button#test //- results in Button()
```

If you use html, you must always provide a tag. In that case, you can use **div** which will also be replaced by **Container()**. For example:

```html
<div class='test'></div> //- results in Container()
<div id='test'></div> //- results in Container()
<container class='test'></container> //- results in Container()
```

### Adding properties using styles

Now that you have assigned classes and ids to elements, you can use css or sass to add properties to elements that match those classes and ids.

Let's say we create a container:

```pug
.message Hello!
```

We know this is a Container, and we can find in the [Flutter Container documentation](https://docs.flutter.io/flutter/widgets/Container/Container.html) that Container has a constructor property *height* we can set, which is a double. We can of course just set it directly in our view:

```pug
.message(:height='100.0') Hello!
```

However, instead, we can also set it using a style rule:

```sass
.message
	height: 100
```

Since the class matches, the style will be converted into a property, and added as a constructor property of the Container, with the following combined code:

```dart
Container(
	child: Text('Hello!'),
	height: (100).toDouble()
)
```

*Note: flutter-view has some convenience parsing built in, so you do not have to set 100.0, and can instead use 100. the (100).toDouble() makes sure the value is converted to a double for you.*

#### Adding expressions in styles

Since all we are doing is generating code, you can also put simple code expressions in your styles.

For example, say that you want to set an icon on this tabbar:

```pug
bottom-navigation-bar-item#home-bar-item
	.title(as='title') Home
```

Since it has an id *#home-bar-item*, you can style it:

```sass
#home-bar-item
	icon: ':Icon(Icons.home)'
```

Notice the *:* sign before *:Icon(Icons.home)*. This is to indicate that this is an expression and not a literal string. It must be part of the total string you pass.

The resulting code will now be in Dart:

```dart
BottomNavigationBarItem(
	icon: Icon(Icons.home),
	title: Text("Home")
)
```

#### Dynamic styling and animation

We can also use this same principle to animate elements with styles:

```pug
animated-message(flutter-view :target-height)
	animated-container(:duration-ms=1000).message 
		| Hello!
```

```sass
.message
	height: ':targetHeight'
```

#### Passing code for widget styling

*AnimatedContainer* will animate its properties over the passed duration. We refer to the targetHeight in the style property. This means that calling our widget with a new targetHeight will smoothly scale our widget to the new height.

This "trick" of passing code in styles should not be abused. The general rule is that it should be for the purpose of styling only. Remember that you can pass anything through properties, even functions. Let's say you want a complicated calculation to happen on the height before you set it as the style. Instead of inlining the code in the style, you can pass the code to your widget:

```pug
animated-message(flutter-view :value :toMessageHeight)
	animated-container(:duration-ms=1000).message 
		| Hello!
```

```sass
.message
	height: ':toMessageHeight(value)'
```

```dart
double toMessageHeight(double value) {
	return sin(value) * 50;
}
final buildFunction = (context) {
	return AnimatedMessage(currentCount, toMessageHeight)
}
```

The idea of flutter-view is to force you to separate your concerns. The views are about presentation. Any code you want to use to change behavior you either pass, or you create widgets that have that behavior and use them in your view.









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

