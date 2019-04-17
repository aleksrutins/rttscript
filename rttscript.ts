namespace RTTScript {
  export namespace StdLib {
    export function typeCheck<T>(tipe: string, value: T): T {
      try {
        let actualT = eval(tipe);
        if (value instanceof actualT) {
          return value;
        } else {
          throw new TypeError(
            `'${value.toString()}' is not an instance of '${tipe}`
          );
        }
      } catch (e) {
        if (typeof value === tipe) {
          return value;
        } else {
          throw new TypeError(
            `'${value.toString()}' is not an instance of '${tipe}`
          );
        }
      }
    }
    export function typedClassCustomObservable<T>(
      type: string,
      setter: Function,
      getter: Function
    ): Function {
      return function() {
        if (arguments.length > 0) {
          //setter
          setter(typeCheck(type, arguments[0]));
        } else {
          // getter
          return typeCheck(type, getter());
        }
      };
    }
    export function extend<T, B>(target: { new (): T }, base: { new (): B }) {
      target.prototype = Object.create(base.prototype);
      target.prototype.constructor = target;
    }
  }
  function compileClassBody(body: string): string {
    return body.replace(
      /(.*?) property (.*?) {[\n\s]*get {[\n\s]*([\s\S\n]*)}[\n\s]*set\((.*?)\) {[\n\s]*([\s\S\n])[\n\s]*}[\n\s]*}/gm,
      (_all, type, name, getter, setterArgs, setter) =>
        `this.${name} = RTTScript.StdLib.typedClassCustomObservable(${type}, (function(${setterArgs}) {${setter}}).bind({}), (function() {${getter}}).bind({}));`
    );
  }
  export function compile(code: string): string {
    var newCode: string = code
      .replace(
        /(.*?) (.*?) = ([\s\S]*?);/gm,
        (_all, tipe, name, value) => `
this["${name}"] = RTTScript.StdLib.typeCheck("${tipe}", (${value}));
    `
      )
      .replace(/\@(.*?)/gm, "this.$1")
      .replace(
        new RegExp(
          `class (.*?)<(.*?)>\\s?(?:extends (.*?))?\\s?\\((.*?)\\)\\s?{
    ([\\s\\S\\n]*?)
}`,
          "gm"
        ),
        (_all, name, typeArgs, extend, constructorArgs, body) => `
function ${name}(${typeArgs}) {
    return function __constructor__(${constructorArgs}) {
      ${
        extend === ""
          ? `RTTScript.StdLib.extends(__constructor__, ${extend});`
          : ""
      }
      ${compileClassBody(body)}
    }
}
`
      )
      .replace(
        /new (.*?)<(.*?)>\((.*?)\)/gm,
        (_all, name, typeArgs, constructorArgs) =>
          `new (${name}(${typeArgs}))(${constructorArgs})`
      );

    return newCode;
  }
  export function run(code: string): any {
    return eval(compile(code));
  }
}
