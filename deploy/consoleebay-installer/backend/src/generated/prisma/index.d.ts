
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Location
 * 
 */
export type Location = $Result.DefaultSelection<Prisma.$LocationPayload>
/**
 * Model EbayAccount
 * 
 */
export type EbayAccount = $Result.DefaultSelection<Prisma.$EbayAccountPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Item
 * 
 */
export type Item = $Result.DefaultSelection<Prisma.$ItemPayload>
/**
 * Model UserSession
 * 
 */
export type UserSession = $Result.DefaultSelection<Prisma.$UserSessionPayload>
/**
 * Model Photo
 * 
 */
export type Photo = $Result.DefaultSelection<Prisma.$PhotoPayload>
/**
 * Model WorkflowAction
 * 
 */
export type WorkflowAction = $Result.DefaultSelection<Prisma.$WorkflowActionPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserRole: {
  ADMIN: 'ADMIN',
  PHOTOGRAPHER: 'PHOTOGRAPHER',
  PROCESSOR: 'PROCESSOR',
  PRICER: 'PRICER',
  PUBLISHER: 'PUBLISHER',
  MANAGER: 'MANAGER'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const WorkflowStage: {
  PHOTO_UPLOAD: 'PHOTO_UPLOAD',
  AI_PROCESSING: 'AI_PROCESSING',
  REVIEW_EDIT: 'REVIEW_EDIT',
  PRICING: 'PRICING',
  FINAL_REVIEW: 'FINAL_REVIEW',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED'
};

export type WorkflowStage = (typeof WorkflowStage)[keyof typeof WorkflowStage]


export const ItemStatus: {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
  ERROR: 'ERROR'
};

export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus]

}

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

export type WorkflowStage = $Enums.WorkflowStage

export const WorkflowStage: typeof $Enums.WorkflowStage

export type ItemStatus = $Enums.ItemStatus

export const ItemStatus: typeof $Enums.ItemStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Locations
 * const locations = await prisma.location.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Locations
   * const locations = await prisma.location.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.location`: Exposes CRUD operations for the **Location** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Locations
    * const locations = await prisma.location.findMany()
    * ```
    */
  get location(): Prisma.LocationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.ebayAccount`: Exposes CRUD operations for the **EbayAccount** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EbayAccounts
    * const ebayAccounts = await prisma.ebayAccount.findMany()
    * ```
    */
  get ebayAccount(): Prisma.EbayAccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.item`: Exposes CRUD operations for the **Item** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Items
    * const items = await prisma.item.findMany()
    * ```
    */
  get item(): Prisma.ItemDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userSession`: Exposes CRUD operations for the **UserSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UserSessions
    * const userSessions = await prisma.userSession.findMany()
    * ```
    */
  get userSession(): Prisma.UserSessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.photo`: Exposes CRUD operations for the **Photo** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Photos
    * const photos = await prisma.photo.findMany()
    * ```
    */
  get photo(): Prisma.PhotoDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.workflowAction`: Exposes CRUD operations for the **WorkflowAction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkflowActions
    * const workflowActions = await prisma.workflowAction.findMany()
    * ```
    */
  get workflowAction(): Prisma.WorkflowActionDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.15.0
   * Query Engine version: 85179d7826409ee107a6ba334b5e305ae3fba9fb
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Location: 'Location',
    EbayAccount: 'EbayAccount',
    User: 'User',
    Item: 'Item',
    UserSession: 'UserSession',
    Photo: 'Photo',
    WorkflowAction: 'WorkflowAction'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "location" | "ebayAccount" | "user" | "item" | "userSession" | "photo" | "workflowAction"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Location: {
        payload: Prisma.$LocationPayload<ExtArgs>
        fields: Prisma.LocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findFirst: {
            args: Prisma.LocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findMany: {
            args: Prisma.LocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          create: {
            args: Prisma.LocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          createMany: {
            args: Prisma.LocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          delete: {
            args: Prisma.LocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          update: {
            args: Prisma.LocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          deleteMany: {
            args: Prisma.LocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LocationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          upsert: {
            args: Prisma.LocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          aggregate: {
            args: Prisma.LocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLocation>
          }
          groupBy: {
            args: Prisma.LocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<LocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.LocationCountArgs<ExtArgs>
            result: $Utils.Optional<LocationCountAggregateOutputType> | number
          }
        }
      }
      EbayAccount: {
        payload: Prisma.$EbayAccountPayload<ExtArgs>
        fields: Prisma.EbayAccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EbayAccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EbayAccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>
          }
          findFirst: {
            args: Prisma.EbayAccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EbayAccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>
          }
          findMany: {
            args: Prisma.EbayAccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>[]
          }
          create: {
            args: Prisma.EbayAccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>
          }
          createMany: {
            args: Prisma.EbayAccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EbayAccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>[]
          }
          delete: {
            args: Prisma.EbayAccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>
          }
          update: {
            args: Prisma.EbayAccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>
          }
          deleteMany: {
            args: Prisma.EbayAccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EbayAccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EbayAccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>[]
          }
          upsert: {
            args: Prisma.EbayAccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EbayAccountPayload>
          }
          aggregate: {
            args: Prisma.EbayAccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEbayAccount>
          }
          groupBy: {
            args: Prisma.EbayAccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<EbayAccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.EbayAccountCountArgs<ExtArgs>
            result: $Utils.Optional<EbayAccountCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Item: {
        payload: Prisma.$ItemPayload<ExtArgs>
        fields: Prisma.ItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          findFirst: {
            args: Prisma.ItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          findMany: {
            args: Prisma.ItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>[]
          }
          create: {
            args: Prisma.ItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          createMany: {
            args: Prisma.ItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>[]
          }
          delete: {
            args: Prisma.ItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          update: {
            args: Prisma.ItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          deleteMany: {
            args: Prisma.ItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ItemUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>[]
          }
          upsert: {
            args: Prisma.ItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          aggregate: {
            args: Prisma.ItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateItem>
          }
          groupBy: {
            args: Prisma.ItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<ItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.ItemCountArgs<ExtArgs>
            result: $Utils.Optional<ItemCountAggregateOutputType> | number
          }
        }
      }
      UserSession: {
        payload: Prisma.$UserSessionPayload<ExtArgs>
        fields: Prisma.UserSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>
          }
          findFirst: {
            args: Prisma.UserSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>
          }
          findMany: {
            args: Prisma.UserSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>[]
          }
          create: {
            args: Prisma.UserSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>
          }
          createMany: {
            args: Prisma.UserSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>[]
          }
          delete: {
            args: Prisma.UserSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>
          }
          update: {
            args: Prisma.UserSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>
          }
          deleteMany: {
            args: Prisma.UserSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>[]
          }
          upsert: {
            args: Prisma.UserSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserSessionPayload>
          }
          aggregate: {
            args: Prisma.UserSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUserSession>
          }
          groupBy: {
            args: Prisma.UserSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserSessionCountArgs<ExtArgs>
            result: $Utils.Optional<UserSessionCountAggregateOutputType> | number
          }
        }
      }
      Photo: {
        payload: Prisma.$PhotoPayload<ExtArgs>
        fields: Prisma.PhotoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PhotoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PhotoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>
          }
          findFirst: {
            args: Prisma.PhotoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PhotoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>
          }
          findMany: {
            args: Prisma.PhotoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>[]
          }
          create: {
            args: Prisma.PhotoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>
          }
          createMany: {
            args: Prisma.PhotoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PhotoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>[]
          }
          delete: {
            args: Prisma.PhotoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>
          }
          update: {
            args: Prisma.PhotoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>
          }
          deleteMany: {
            args: Prisma.PhotoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PhotoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PhotoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>[]
          }
          upsert: {
            args: Prisma.PhotoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PhotoPayload>
          }
          aggregate: {
            args: Prisma.PhotoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePhoto>
          }
          groupBy: {
            args: Prisma.PhotoGroupByArgs<ExtArgs>
            result: $Utils.Optional<PhotoGroupByOutputType>[]
          }
          count: {
            args: Prisma.PhotoCountArgs<ExtArgs>
            result: $Utils.Optional<PhotoCountAggregateOutputType> | number
          }
        }
      }
      WorkflowAction: {
        payload: Prisma.$WorkflowActionPayload<ExtArgs>
        fields: Prisma.WorkflowActionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkflowActionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkflowActionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>
          }
          findFirst: {
            args: Prisma.WorkflowActionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkflowActionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>
          }
          findMany: {
            args: Prisma.WorkflowActionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>[]
          }
          create: {
            args: Prisma.WorkflowActionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>
          }
          createMany: {
            args: Prisma.WorkflowActionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkflowActionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>[]
          }
          delete: {
            args: Prisma.WorkflowActionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>
          }
          update: {
            args: Prisma.WorkflowActionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>
          }
          deleteMany: {
            args: Prisma.WorkflowActionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkflowActionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorkflowActionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>[]
          }
          upsert: {
            args: Prisma.WorkflowActionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkflowActionPayload>
          }
          aggregate: {
            args: Prisma.WorkflowActionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkflowAction>
          }
          groupBy: {
            args: Prisma.WorkflowActionGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkflowActionGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkflowActionCountArgs<ExtArgs>
            result: $Utils.Optional<WorkflowActionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    location?: LocationOmit
    ebayAccount?: EbayAccountOmit
    user?: UserOmit
    item?: ItemOmit
    userSession?: UserSessionOmit
    photo?: PhotoOmit
    workflowAction?: WorkflowActionOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type LocationCountOutputType
   */

  export type LocationCountOutputType = {
    users: number
    items: number
    ebayAccounts: number
  }

  export type LocationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | LocationCountOutputTypeCountUsersArgs
    items?: boolean | LocationCountOutputTypeCountItemsArgs
    ebayAccounts?: boolean | LocationCountOutputTypeCountEbayAccountsArgs
  }

  // Custom InputTypes
  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LocationCountOutputType
     */
    select?: LocationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountUsersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
  }

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountEbayAccountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EbayAccountWhereInput
  }


  /**
   * Count Type EbayAccountCountOutputType
   */

  export type EbayAccountCountOutputType = {
    items: number
  }

  export type EbayAccountCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    items?: boolean | EbayAccountCountOutputTypeCountItemsArgs
  }

  // Custom InputTypes
  /**
   * EbayAccountCountOutputType without action
   */
  export type EbayAccountCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccountCountOutputType
     */
    select?: EbayAccountCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EbayAccountCountOutputType without action
   */
  export type EbayAccountCountOutputTypeCountItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
  }


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    itemsCreated: number
    workflowActions: number
    sessions: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    itemsCreated?: boolean | UserCountOutputTypeCountItemsCreatedArgs
    workflowActions?: boolean | UserCountOutputTypeCountWorkflowActionsArgs
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountItemsCreatedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountWorkflowActionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkflowActionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserSessionWhereInput
  }


  /**
   * Count Type ItemCountOutputType
   */

  export type ItemCountOutputType = {
    photos: number
    workflowActions: number
  }

  export type ItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    photos?: boolean | ItemCountOutputTypeCountPhotosArgs
    workflowActions?: boolean | ItemCountOutputTypeCountWorkflowActionsArgs
  }

  // Custom InputTypes
  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCountOutputType
     */
    select?: ItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountPhotosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PhotoWhereInput
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountWorkflowActionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkflowActionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Location
   */

  export type AggregateLocation = {
    _count: LocationCountAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  export type LocationMinAggregateOutputType = {
    id: string | null
    name: string | null
    code: string | null
    address: string | null
    timezone: string | null
    isActive: boolean | null
    serverUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocationMaxAggregateOutputType = {
    id: string | null
    name: string | null
    code: string | null
    address: string | null
    timezone: string | null
    isActive: boolean | null
    serverUrl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocationCountAggregateOutputType = {
    id: number
    name: number
    code: number
    address: number
    timezone: number
    isActive: number
    serverUrl: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LocationMinAggregateInputType = {
    id?: true
    name?: true
    code?: true
    address?: true
    timezone?: true
    isActive?: true
    serverUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocationMaxAggregateInputType = {
    id?: true
    name?: true
    code?: true
    address?: true
    timezone?: true
    isActive?: true
    serverUrl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocationCountAggregateInputType = {
    id?: true
    name?: true
    code?: true
    address?: true
    timezone?: true
    isActive?: true
    serverUrl?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Location to aggregate.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Locations
    **/
    _count?: true | LocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LocationMaxAggregateInputType
  }

  export type GetLocationAggregateType<T extends LocationAggregateArgs> = {
        [P in keyof T & keyof AggregateLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocation[P]>
      : GetScalarType<T[P], AggregateLocation[P]>
  }




  export type LocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithAggregationInput | LocationOrderByWithAggregationInput[]
    by: LocationScalarFieldEnum[] | LocationScalarFieldEnum
    having?: LocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LocationCountAggregateInputType | true
    _min?: LocationMinAggregateInputType
    _max?: LocationMaxAggregateInputType
  }

  export type LocationGroupByOutputType = {
    id: string
    name: string
    code: string
    address: string | null
    timezone: string
    isActive: boolean
    serverUrl: string | null
    createdAt: Date
    updatedAt: Date
    _count: LocationCountAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  type GetLocationGroupByPayload<T extends LocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocationGroupByOutputType[P]>
            : GetScalarType<T[P], LocationGroupByOutputType[P]>
        }
      >
    >


  export type LocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    address?: boolean
    timezone?: boolean
    isActive?: boolean
    serverUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    users?: boolean | Location$usersArgs<ExtArgs>
    items?: boolean | Location$itemsArgs<ExtArgs>
    ebayAccounts?: boolean | Location$ebayAccountsArgs<ExtArgs>
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["location"]>

  export type LocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    address?: boolean
    timezone?: boolean
    isActive?: boolean
    serverUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    code?: boolean
    address?: boolean
    timezone?: boolean
    isActive?: boolean
    serverUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectScalar = {
    id?: boolean
    name?: boolean
    code?: boolean
    address?: boolean
    timezone?: boolean
    isActive?: boolean
    serverUrl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LocationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "code" | "address" | "timezone" | "isActive" | "serverUrl" | "createdAt" | "updatedAt", ExtArgs["result"]["location"]>
  export type LocationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    users?: boolean | Location$usersArgs<ExtArgs>
    items?: boolean | Location$itemsArgs<ExtArgs>
    ebayAccounts?: boolean | Location$ebayAccountsArgs<ExtArgs>
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LocationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type LocationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $LocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Location"
    objects: {
      users: Prisma.$UserPayload<ExtArgs>[]
      items: Prisma.$ItemPayload<ExtArgs>[]
      ebayAccounts: Prisma.$EbayAccountPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      code: string
      address: string | null
      timezone: string
      isActive: boolean
      serverUrl: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["location"]>
    composites: {}
  }

  type LocationGetPayload<S extends boolean | null | undefined | LocationDefaultArgs> = $Result.GetResult<Prisma.$LocationPayload, S>

  type LocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LocationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LocationCountAggregateInputType | true
    }

  export interface LocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Location'], meta: { name: 'Location' } }
    /**
     * Find zero or one Location that matches the filter.
     * @param {LocationFindUniqueArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocationFindUniqueArgs>(args: SelectSubset<T, LocationFindUniqueArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Location that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LocationFindUniqueOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocationFindUniqueOrThrowArgs>(args: SelectSubset<T, LocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Location that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocationFindFirstArgs>(args?: SelectSubset<T, LocationFindFirstArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Location that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocationFindFirstOrThrowArgs>(args?: SelectSubset<T, LocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Locations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locations
     * const locations = await prisma.location.findMany()
     * 
     * // Get first 10 Locations
     * const locations = await prisma.location.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const locationWithIdOnly = await prisma.location.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LocationFindManyArgs>(args?: SelectSubset<T, LocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Location.
     * @param {LocationCreateArgs} args - Arguments to create a Location.
     * @example
     * // Create one Location
     * const Location = await prisma.location.create({
     *   data: {
     *     // ... data to create a Location
     *   }
     * })
     * 
     */
    create<T extends LocationCreateArgs>(args: SelectSubset<T, LocationCreateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Locations.
     * @param {LocationCreateManyArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LocationCreateManyArgs>(args?: SelectSubset<T, LocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Locations and returns the data saved in the database.
     * @param {LocationCreateManyAndReturnArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LocationCreateManyAndReturnArgs>(args?: SelectSubset<T, LocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Location.
     * @param {LocationDeleteArgs} args - Arguments to delete one Location.
     * @example
     * // Delete one Location
     * const Location = await prisma.location.delete({
     *   where: {
     *     // ... filter to delete one Location
     *   }
     * })
     * 
     */
    delete<T extends LocationDeleteArgs>(args: SelectSubset<T, LocationDeleteArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Location.
     * @param {LocationUpdateArgs} args - Arguments to update one Location.
     * @example
     * // Update one Location
     * const location = await prisma.location.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LocationUpdateArgs>(args: SelectSubset<T, LocationUpdateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Locations.
     * @param {LocationDeleteManyArgs} args - Arguments to filter Locations to delete.
     * @example
     * // Delete a few Locations
     * const { count } = await prisma.location.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LocationDeleteManyArgs>(args?: SelectSubset<T, LocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LocationUpdateManyArgs>(args: SelectSubset<T, LocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations and returns the data updated in the database.
     * @param {LocationUpdateManyAndReturnArgs} args - Arguments to update many Locations.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LocationUpdateManyAndReturnArgs>(args: SelectSubset<T, LocationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Location.
     * @param {LocationUpsertArgs} args - Arguments to update or create a Location.
     * @example
     * // Update or create a Location
     * const location = await prisma.location.upsert({
     *   create: {
     *     // ... data to create a Location
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Location we want to update
     *   }
     * })
     */
    upsert<T extends LocationUpsertArgs>(args: SelectSubset<T, LocationUpsertArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationCountArgs} args - Arguments to filter Locations to count.
     * @example
     * // Count the number of Locations
     * const count = await prisma.location.count({
     *   where: {
     *     // ... the filter for the Locations we want to count
     *   }
     * })
    **/
    count<T extends LocationCountArgs>(
      args?: Subset<T, LocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LocationAggregateArgs>(args: Subset<T, LocationAggregateArgs>): Prisma.PrismaPromise<GetLocationAggregateType<T>>

    /**
     * Group by Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocationGroupByArgs['orderBy'] }
        : { orderBy?: LocationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Location model
   */
  readonly fields: LocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Location.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    users<T extends Location$usersArgs<ExtArgs> = {}>(args?: Subset<T, Location$usersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    items<T extends Location$itemsArgs<ExtArgs> = {}>(args?: Subset<T, Location$itemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    ebayAccounts<T extends Location$ebayAccountsArgs<ExtArgs> = {}>(args?: Subset<T, Location$ebayAccountsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Location model
   */
  interface LocationFieldRefs {
    readonly id: FieldRef<"Location", 'String'>
    readonly name: FieldRef<"Location", 'String'>
    readonly code: FieldRef<"Location", 'String'>
    readonly address: FieldRef<"Location", 'String'>
    readonly timezone: FieldRef<"Location", 'String'>
    readonly isActive: FieldRef<"Location", 'Boolean'>
    readonly serverUrl: FieldRef<"Location", 'String'>
    readonly createdAt: FieldRef<"Location", 'DateTime'>
    readonly updatedAt: FieldRef<"Location", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Location findUnique
   */
  export type LocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findUniqueOrThrow
   */
  export type LocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findFirst
   */
  export type LocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findFirstOrThrow
   */
  export type LocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findMany
   */
  export type LocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter, which Locations to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location create
   */
  export type LocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to create a Location.
     */
    data: XOR<LocationCreateInput, LocationUncheckedCreateInput>
  }

  /**
   * Location createMany
   */
  export type LocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location createManyAndReturn
   */
  export type LocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location update
   */
  export type LocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The data needed to update a Location.
     */
    data: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
    /**
     * Choose, which Location to update.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location updateMany
   */
  export type LocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to update.
     */
    limit?: number
  }

  /**
   * Location updateManyAndReturn
   */
  export type LocationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to update.
     */
    limit?: number
  }

  /**
   * Location upsert
   */
  export type LocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * The filter to search for the Location to update in case it exists.
     */
    where: LocationWhereUniqueInput
    /**
     * In case the Location found by the `where` argument doesn't exist, create a new Location with this data.
     */
    create: XOR<LocationCreateInput, LocationUncheckedCreateInput>
    /**
     * In case the Location was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
  }

  /**
   * Location delete
   */
  export type LocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    /**
     * Filter which Location to delete.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location deleteMany
   */
  export type LocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locations to delete
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to delete.
     */
    limit?: number
  }

  /**
   * Location.users
   */
  export type Location$usersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * Location.items
   */
  export type Location$itemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    cursor?: ItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Location.ebayAccounts
   */
  export type Location$ebayAccountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    where?: EbayAccountWhereInput
    orderBy?: EbayAccountOrderByWithRelationInput | EbayAccountOrderByWithRelationInput[]
    cursor?: EbayAccountWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EbayAccountScalarFieldEnum | EbayAccountScalarFieldEnum[]
  }

  /**
   * Location without action
   */
  export type LocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
  }


  /**
   * Model EbayAccount
   */

  export type AggregateEbayAccount = {
    _count: EbayAccountCountAggregateOutputType | null
    _avg: EbayAccountAvgAggregateOutputType | null
    _sum: EbayAccountSumAggregateOutputType | null
    _min: EbayAccountMinAggregateOutputType | null
    _max: EbayAccountMaxAggregateOutputType | null
  }

  export type EbayAccountAvgAggregateOutputType = {
    siteId: number | null
  }

  export type EbayAccountSumAggregateOutputType = {
    siteId: number | null
  }

  export type EbayAccountMinAggregateOutputType = {
    id: string | null
    accountName: string | null
    email: string | null
    appId: string | null
    certId: string | null
    devId: string | null
    authToken: string | null
    refreshToken: string | null
    sandbox: boolean | null
    siteId: number | null
    paypalEmail: string | null
    postalCode: string | null
    isActive: boolean | null
    lastSync: Date | null
    locationId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EbayAccountMaxAggregateOutputType = {
    id: string | null
    accountName: string | null
    email: string | null
    appId: string | null
    certId: string | null
    devId: string | null
    authToken: string | null
    refreshToken: string | null
    sandbox: boolean | null
    siteId: number | null
    paypalEmail: string | null
    postalCode: string | null
    isActive: boolean | null
    lastSync: Date | null
    locationId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EbayAccountCountAggregateOutputType = {
    id: number
    accountName: number
    email: number
    appId: number
    certId: number
    devId: number
    authToken: number
    refreshToken: number
    sandbox: number
    siteId: number
    paypalEmail: number
    postalCode: number
    isActive: number
    lastSync: number
    locationId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EbayAccountAvgAggregateInputType = {
    siteId?: true
  }

  export type EbayAccountSumAggregateInputType = {
    siteId?: true
  }

  export type EbayAccountMinAggregateInputType = {
    id?: true
    accountName?: true
    email?: true
    appId?: true
    certId?: true
    devId?: true
    authToken?: true
    refreshToken?: true
    sandbox?: true
    siteId?: true
    paypalEmail?: true
    postalCode?: true
    isActive?: true
    lastSync?: true
    locationId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EbayAccountMaxAggregateInputType = {
    id?: true
    accountName?: true
    email?: true
    appId?: true
    certId?: true
    devId?: true
    authToken?: true
    refreshToken?: true
    sandbox?: true
    siteId?: true
    paypalEmail?: true
    postalCode?: true
    isActive?: true
    lastSync?: true
    locationId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EbayAccountCountAggregateInputType = {
    id?: true
    accountName?: true
    email?: true
    appId?: true
    certId?: true
    devId?: true
    authToken?: true
    refreshToken?: true
    sandbox?: true
    siteId?: true
    paypalEmail?: true
    postalCode?: true
    isActive?: true
    lastSync?: true
    locationId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EbayAccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EbayAccount to aggregate.
     */
    where?: EbayAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EbayAccounts to fetch.
     */
    orderBy?: EbayAccountOrderByWithRelationInput | EbayAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EbayAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EbayAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EbayAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EbayAccounts
    **/
    _count?: true | EbayAccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EbayAccountAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EbayAccountSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EbayAccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EbayAccountMaxAggregateInputType
  }

  export type GetEbayAccountAggregateType<T extends EbayAccountAggregateArgs> = {
        [P in keyof T & keyof AggregateEbayAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEbayAccount[P]>
      : GetScalarType<T[P], AggregateEbayAccount[P]>
  }




  export type EbayAccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EbayAccountWhereInput
    orderBy?: EbayAccountOrderByWithAggregationInput | EbayAccountOrderByWithAggregationInput[]
    by: EbayAccountScalarFieldEnum[] | EbayAccountScalarFieldEnum
    having?: EbayAccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EbayAccountCountAggregateInputType | true
    _avg?: EbayAccountAvgAggregateInputType
    _sum?: EbayAccountSumAggregateInputType
    _min?: EbayAccountMinAggregateInputType
    _max?: EbayAccountMaxAggregateInputType
  }

  export type EbayAccountGroupByOutputType = {
    id: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken: string | null
    refreshToken: string | null
    sandbox: boolean
    siteId: number
    paypalEmail: string | null
    postalCode: string | null
    isActive: boolean
    lastSync: Date | null
    locationId: string
    createdAt: Date
    updatedAt: Date
    _count: EbayAccountCountAggregateOutputType | null
    _avg: EbayAccountAvgAggregateOutputType | null
    _sum: EbayAccountSumAggregateOutputType | null
    _min: EbayAccountMinAggregateOutputType | null
    _max: EbayAccountMaxAggregateOutputType | null
  }

  type GetEbayAccountGroupByPayload<T extends EbayAccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EbayAccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EbayAccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EbayAccountGroupByOutputType[P]>
            : GetScalarType<T[P], EbayAccountGroupByOutputType[P]>
        }
      >
    >


  export type EbayAccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    accountName?: boolean
    email?: boolean
    appId?: boolean
    certId?: boolean
    devId?: boolean
    authToken?: boolean
    refreshToken?: boolean
    sandbox?: boolean
    siteId?: boolean
    paypalEmail?: boolean
    postalCode?: boolean
    isActive?: boolean
    lastSync?: boolean
    locationId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | LocationDefaultArgs<ExtArgs>
    items?: boolean | EbayAccount$itemsArgs<ExtArgs>
    _count?: boolean | EbayAccountCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ebayAccount"]>

  export type EbayAccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    accountName?: boolean
    email?: boolean
    appId?: boolean
    certId?: boolean
    devId?: boolean
    authToken?: boolean
    refreshToken?: boolean
    sandbox?: boolean
    siteId?: boolean
    paypalEmail?: boolean
    postalCode?: boolean
    isActive?: boolean
    lastSync?: boolean
    locationId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | LocationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ebayAccount"]>

  export type EbayAccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    accountName?: boolean
    email?: boolean
    appId?: boolean
    certId?: boolean
    devId?: boolean
    authToken?: boolean
    refreshToken?: boolean
    sandbox?: boolean
    siteId?: boolean
    paypalEmail?: boolean
    postalCode?: boolean
    isActive?: boolean
    lastSync?: boolean
    locationId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | LocationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ebayAccount"]>

  export type EbayAccountSelectScalar = {
    id?: boolean
    accountName?: boolean
    email?: boolean
    appId?: boolean
    certId?: boolean
    devId?: boolean
    authToken?: boolean
    refreshToken?: boolean
    sandbox?: boolean
    siteId?: boolean
    paypalEmail?: boolean
    postalCode?: boolean
    isActive?: boolean
    lastSync?: boolean
    locationId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EbayAccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "accountName" | "email" | "appId" | "certId" | "devId" | "authToken" | "refreshToken" | "sandbox" | "siteId" | "paypalEmail" | "postalCode" | "isActive" | "lastSync" | "locationId" | "createdAt" | "updatedAt", ExtArgs["result"]["ebayAccount"]>
  export type EbayAccountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | LocationDefaultArgs<ExtArgs>
    items?: boolean | EbayAccount$itemsArgs<ExtArgs>
    _count?: boolean | EbayAccountCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type EbayAccountIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | LocationDefaultArgs<ExtArgs>
  }
  export type EbayAccountIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | LocationDefaultArgs<ExtArgs>
  }

  export type $EbayAccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EbayAccount"
    objects: {
      location: Prisma.$LocationPayload<ExtArgs>
      items: Prisma.$ItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      accountName: string
      email: string
      appId: string
      certId: string
      devId: string
      authToken: string | null
      refreshToken: string | null
      sandbox: boolean
      siteId: number
      paypalEmail: string | null
      postalCode: string | null
      isActive: boolean
      lastSync: Date | null
      locationId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["ebayAccount"]>
    composites: {}
  }

  type EbayAccountGetPayload<S extends boolean | null | undefined | EbayAccountDefaultArgs> = $Result.GetResult<Prisma.$EbayAccountPayload, S>

  type EbayAccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EbayAccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EbayAccountCountAggregateInputType | true
    }

  export interface EbayAccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EbayAccount'], meta: { name: 'EbayAccount' } }
    /**
     * Find zero or one EbayAccount that matches the filter.
     * @param {EbayAccountFindUniqueArgs} args - Arguments to find a EbayAccount
     * @example
     * // Get one EbayAccount
     * const ebayAccount = await prisma.ebayAccount.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EbayAccountFindUniqueArgs>(args: SelectSubset<T, EbayAccountFindUniqueArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EbayAccount that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EbayAccountFindUniqueOrThrowArgs} args - Arguments to find a EbayAccount
     * @example
     * // Get one EbayAccount
     * const ebayAccount = await prisma.ebayAccount.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EbayAccountFindUniqueOrThrowArgs>(args: SelectSubset<T, EbayAccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EbayAccount that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EbayAccountFindFirstArgs} args - Arguments to find a EbayAccount
     * @example
     * // Get one EbayAccount
     * const ebayAccount = await prisma.ebayAccount.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EbayAccountFindFirstArgs>(args?: SelectSubset<T, EbayAccountFindFirstArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EbayAccount that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EbayAccountFindFirstOrThrowArgs} args - Arguments to find a EbayAccount
     * @example
     * // Get one EbayAccount
     * const ebayAccount = await prisma.ebayAccount.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EbayAccountFindFirstOrThrowArgs>(args?: SelectSubset<T, EbayAccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EbayAccounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EbayAccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EbayAccounts
     * const ebayAccounts = await prisma.ebayAccount.findMany()
     * 
     * // Get first 10 EbayAccounts
     * const ebayAccounts = await prisma.ebayAccount.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ebayAccountWithIdOnly = await prisma.ebayAccount.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EbayAccountFindManyArgs>(args?: SelectSubset<T, EbayAccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EbayAccount.
     * @param {EbayAccountCreateArgs} args - Arguments to create a EbayAccount.
     * @example
     * // Create one EbayAccount
     * const EbayAccount = await prisma.ebayAccount.create({
     *   data: {
     *     // ... data to create a EbayAccount
     *   }
     * })
     * 
     */
    create<T extends EbayAccountCreateArgs>(args: SelectSubset<T, EbayAccountCreateArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EbayAccounts.
     * @param {EbayAccountCreateManyArgs} args - Arguments to create many EbayAccounts.
     * @example
     * // Create many EbayAccounts
     * const ebayAccount = await prisma.ebayAccount.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EbayAccountCreateManyArgs>(args?: SelectSubset<T, EbayAccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EbayAccounts and returns the data saved in the database.
     * @param {EbayAccountCreateManyAndReturnArgs} args - Arguments to create many EbayAccounts.
     * @example
     * // Create many EbayAccounts
     * const ebayAccount = await prisma.ebayAccount.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EbayAccounts and only return the `id`
     * const ebayAccountWithIdOnly = await prisma.ebayAccount.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EbayAccountCreateManyAndReturnArgs>(args?: SelectSubset<T, EbayAccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EbayAccount.
     * @param {EbayAccountDeleteArgs} args - Arguments to delete one EbayAccount.
     * @example
     * // Delete one EbayAccount
     * const EbayAccount = await prisma.ebayAccount.delete({
     *   where: {
     *     // ... filter to delete one EbayAccount
     *   }
     * })
     * 
     */
    delete<T extends EbayAccountDeleteArgs>(args: SelectSubset<T, EbayAccountDeleteArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EbayAccount.
     * @param {EbayAccountUpdateArgs} args - Arguments to update one EbayAccount.
     * @example
     * // Update one EbayAccount
     * const ebayAccount = await prisma.ebayAccount.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EbayAccountUpdateArgs>(args: SelectSubset<T, EbayAccountUpdateArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EbayAccounts.
     * @param {EbayAccountDeleteManyArgs} args - Arguments to filter EbayAccounts to delete.
     * @example
     * // Delete a few EbayAccounts
     * const { count } = await prisma.ebayAccount.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EbayAccountDeleteManyArgs>(args?: SelectSubset<T, EbayAccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EbayAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EbayAccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EbayAccounts
     * const ebayAccount = await prisma.ebayAccount.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EbayAccountUpdateManyArgs>(args: SelectSubset<T, EbayAccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EbayAccounts and returns the data updated in the database.
     * @param {EbayAccountUpdateManyAndReturnArgs} args - Arguments to update many EbayAccounts.
     * @example
     * // Update many EbayAccounts
     * const ebayAccount = await prisma.ebayAccount.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EbayAccounts and only return the `id`
     * const ebayAccountWithIdOnly = await prisma.ebayAccount.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EbayAccountUpdateManyAndReturnArgs>(args: SelectSubset<T, EbayAccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EbayAccount.
     * @param {EbayAccountUpsertArgs} args - Arguments to update or create a EbayAccount.
     * @example
     * // Update or create a EbayAccount
     * const ebayAccount = await prisma.ebayAccount.upsert({
     *   create: {
     *     // ... data to create a EbayAccount
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EbayAccount we want to update
     *   }
     * })
     */
    upsert<T extends EbayAccountUpsertArgs>(args: SelectSubset<T, EbayAccountUpsertArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EbayAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EbayAccountCountArgs} args - Arguments to filter EbayAccounts to count.
     * @example
     * // Count the number of EbayAccounts
     * const count = await prisma.ebayAccount.count({
     *   where: {
     *     // ... the filter for the EbayAccounts we want to count
     *   }
     * })
    **/
    count<T extends EbayAccountCountArgs>(
      args?: Subset<T, EbayAccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EbayAccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EbayAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EbayAccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EbayAccountAggregateArgs>(args: Subset<T, EbayAccountAggregateArgs>): Prisma.PrismaPromise<GetEbayAccountAggregateType<T>>

    /**
     * Group by EbayAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EbayAccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EbayAccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EbayAccountGroupByArgs['orderBy'] }
        : { orderBy?: EbayAccountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EbayAccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEbayAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EbayAccount model
   */
  readonly fields: EbayAccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EbayAccount.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EbayAccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    location<T extends LocationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LocationDefaultArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    items<T extends EbayAccount$itemsArgs<ExtArgs> = {}>(args?: Subset<T, EbayAccount$itemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EbayAccount model
   */
  interface EbayAccountFieldRefs {
    readonly id: FieldRef<"EbayAccount", 'String'>
    readonly accountName: FieldRef<"EbayAccount", 'String'>
    readonly email: FieldRef<"EbayAccount", 'String'>
    readonly appId: FieldRef<"EbayAccount", 'String'>
    readonly certId: FieldRef<"EbayAccount", 'String'>
    readonly devId: FieldRef<"EbayAccount", 'String'>
    readonly authToken: FieldRef<"EbayAccount", 'String'>
    readonly refreshToken: FieldRef<"EbayAccount", 'String'>
    readonly sandbox: FieldRef<"EbayAccount", 'Boolean'>
    readonly siteId: FieldRef<"EbayAccount", 'Int'>
    readonly paypalEmail: FieldRef<"EbayAccount", 'String'>
    readonly postalCode: FieldRef<"EbayAccount", 'String'>
    readonly isActive: FieldRef<"EbayAccount", 'Boolean'>
    readonly lastSync: FieldRef<"EbayAccount", 'DateTime'>
    readonly locationId: FieldRef<"EbayAccount", 'String'>
    readonly createdAt: FieldRef<"EbayAccount", 'DateTime'>
    readonly updatedAt: FieldRef<"EbayAccount", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EbayAccount findUnique
   */
  export type EbayAccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * Filter, which EbayAccount to fetch.
     */
    where: EbayAccountWhereUniqueInput
  }

  /**
   * EbayAccount findUniqueOrThrow
   */
  export type EbayAccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * Filter, which EbayAccount to fetch.
     */
    where: EbayAccountWhereUniqueInput
  }

  /**
   * EbayAccount findFirst
   */
  export type EbayAccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * Filter, which EbayAccount to fetch.
     */
    where?: EbayAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EbayAccounts to fetch.
     */
    orderBy?: EbayAccountOrderByWithRelationInput | EbayAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EbayAccounts.
     */
    cursor?: EbayAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EbayAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EbayAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EbayAccounts.
     */
    distinct?: EbayAccountScalarFieldEnum | EbayAccountScalarFieldEnum[]
  }

  /**
   * EbayAccount findFirstOrThrow
   */
  export type EbayAccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * Filter, which EbayAccount to fetch.
     */
    where?: EbayAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EbayAccounts to fetch.
     */
    orderBy?: EbayAccountOrderByWithRelationInput | EbayAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EbayAccounts.
     */
    cursor?: EbayAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EbayAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EbayAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EbayAccounts.
     */
    distinct?: EbayAccountScalarFieldEnum | EbayAccountScalarFieldEnum[]
  }

  /**
   * EbayAccount findMany
   */
  export type EbayAccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * Filter, which EbayAccounts to fetch.
     */
    where?: EbayAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EbayAccounts to fetch.
     */
    orderBy?: EbayAccountOrderByWithRelationInput | EbayAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EbayAccounts.
     */
    cursor?: EbayAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EbayAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EbayAccounts.
     */
    skip?: number
    distinct?: EbayAccountScalarFieldEnum | EbayAccountScalarFieldEnum[]
  }

  /**
   * EbayAccount create
   */
  export type EbayAccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * The data needed to create a EbayAccount.
     */
    data: XOR<EbayAccountCreateInput, EbayAccountUncheckedCreateInput>
  }

  /**
   * EbayAccount createMany
   */
  export type EbayAccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EbayAccounts.
     */
    data: EbayAccountCreateManyInput | EbayAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EbayAccount createManyAndReturn
   */
  export type EbayAccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * The data used to create many EbayAccounts.
     */
    data: EbayAccountCreateManyInput | EbayAccountCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * EbayAccount update
   */
  export type EbayAccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * The data needed to update a EbayAccount.
     */
    data: XOR<EbayAccountUpdateInput, EbayAccountUncheckedUpdateInput>
    /**
     * Choose, which EbayAccount to update.
     */
    where: EbayAccountWhereUniqueInput
  }

  /**
   * EbayAccount updateMany
   */
  export type EbayAccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EbayAccounts.
     */
    data: XOR<EbayAccountUpdateManyMutationInput, EbayAccountUncheckedUpdateManyInput>
    /**
     * Filter which EbayAccounts to update
     */
    where?: EbayAccountWhereInput
    /**
     * Limit how many EbayAccounts to update.
     */
    limit?: number
  }

  /**
   * EbayAccount updateManyAndReturn
   */
  export type EbayAccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * The data used to update EbayAccounts.
     */
    data: XOR<EbayAccountUpdateManyMutationInput, EbayAccountUncheckedUpdateManyInput>
    /**
     * Filter which EbayAccounts to update
     */
    where?: EbayAccountWhereInput
    /**
     * Limit how many EbayAccounts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * EbayAccount upsert
   */
  export type EbayAccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * The filter to search for the EbayAccount to update in case it exists.
     */
    where: EbayAccountWhereUniqueInput
    /**
     * In case the EbayAccount found by the `where` argument doesn't exist, create a new EbayAccount with this data.
     */
    create: XOR<EbayAccountCreateInput, EbayAccountUncheckedCreateInput>
    /**
     * In case the EbayAccount was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EbayAccountUpdateInput, EbayAccountUncheckedUpdateInput>
  }

  /**
   * EbayAccount delete
   */
  export type EbayAccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    /**
     * Filter which EbayAccount to delete.
     */
    where: EbayAccountWhereUniqueInput
  }

  /**
   * EbayAccount deleteMany
   */
  export type EbayAccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EbayAccounts to delete
     */
    where?: EbayAccountWhereInput
    /**
     * Limit how many EbayAccounts to delete.
     */
    limit?: number
  }

  /**
   * EbayAccount.items
   */
  export type EbayAccount$itemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    cursor?: ItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * EbayAccount without action
   */
  export type EbayAccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    role: $Enums.UserRole | null
    password: string | null
    locationId: string | null
    lastActive: Date | null
    isOnline: boolean | null
    currentItemId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    name: string | null
    role: $Enums.UserRole | null
    password: string | null
    locationId: string | null
    lastActive: Date | null
    isOnline: boolean | null
    currentItemId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    role: number
    password: number
    locationId: number
    lastActive: number
    isOnline: number
    currentItemId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    password?: true
    locationId?: true
    lastActive?: true
    isOnline?: true
    currentItemId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    password?: true
    locationId?: true
    lastActive?: true
    isOnline?: true
    currentItemId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    role?: true
    password?: true
    locationId?: true
    lastActive?: true
    isOnline?: true
    currentItemId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    locationId: string | null
    lastActive: Date | null
    isOnline: boolean
    currentItemId: string | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    password?: boolean
    locationId?: boolean
    lastActive?: boolean
    isOnline?: boolean
    currentItemId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | User$locationArgs<ExtArgs>
    itemsCreated?: boolean | User$itemsCreatedArgs<ExtArgs>
    workflowActions?: boolean | User$workflowActionsArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    password?: boolean
    locationId?: boolean
    lastActive?: boolean
    isOnline?: boolean
    currentItemId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | User$locationArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    password?: boolean
    locationId?: boolean
    lastActive?: boolean
    isOnline?: boolean
    currentItemId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | User$locationArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    role?: boolean
    password?: boolean
    locationId?: boolean
    lastActive?: boolean
    isOnline?: boolean
    currentItemId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "name" | "role" | "password" | "locationId" | "lastActive" | "isOnline" | "currentItemId" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | User$locationArgs<ExtArgs>
    itemsCreated?: boolean | User$itemsCreatedArgs<ExtArgs>
    workflowActions?: boolean | User$workflowActionsArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | User$locationArgs<ExtArgs>
  }
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | User$locationArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      location: Prisma.$LocationPayload<ExtArgs> | null
      itemsCreated: Prisma.$ItemPayload<ExtArgs>[]
      workflowActions: Prisma.$WorkflowActionPayload<ExtArgs>[]
      sessions: Prisma.$UserSessionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      name: string
      role: $Enums.UserRole
      password: string
      locationId: string | null
      lastActive: Date | null
      isOnline: boolean
      currentItemId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    location<T extends User$locationArgs<ExtArgs> = {}>(args?: Subset<T, User$locationArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    itemsCreated<T extends User$itemsCreatedArgs<ExtArgs> = {}>(args?: Subset<T, User$itemsCreatedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    workflowActions<T extends User$workflowActionsArgs<ExtArgs> = {}>(args?: Subset<T, User$workflowActionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sessions<T extends User$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'UserRole'>
    readonly password: FieldRef<"User", 'String'>
    readonly locationId: FieldRef<"User", 'String'>
    readonly lastActive: FieldRef<"User", 'DateTime'>
    readonly isOnline: FieldRef<"User", 'Boolean'>
    readonly currentItemId: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.location
   */
  export type User$locationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null
    where?: LocationWhereInput
  }

  /**
   * User.itemsCreated
   */
  export type User$itemsCreatedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    cursor?: ItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * User.workflowActions
   */
  export type User$workflowActionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    where?: WorkflowActionWhereInput
    orderBy?: WorkflowActionOrderByWithRelationInput | WorkflowActionOrderByWithRelationInput[]
    cursor?: WorkflowActionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkflowActionScalarFieldEnum | WorkflowActionScalarFieldEnum[]
  }

  /**
   * User.sessions
   */
  export type User$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    where?: UserSessionWhereInput
    orderBy?: UserSessionOrderByWithRelationInput | UserSessionOrderByWithRelationInput[]
    cursor?: UserSessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserSessionScalarFieldEnum | UserSessionScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Item
   */

  export type AggregateItem = {
    _count: ItemCountAggregateOutputType | null
    _avg: ItemAvgAggregateOutputType | null
    _sum: ItemSumAggregateOutputType | null
    _min: ItemMinAggregateOutputType | null
    _max: ItemMaxAggregateOutputType | null
  }

  export type ItemAvgAggregateOutputType = {
    startingPrice: number | null
    buyNowPrice: number | null
    shippingCost: number | null
  }

  export type ItemSumAggregateOutputType = {
    startingPrice: number | null
    buyNowPrice: number | null
    shippingCost: number | null
  }

  export type ItemMinAggregateOutputType = {
    id: string | null
    sku: string | null
    stage: $Enums.WorkflowStage | null
    status: $Enums.ItemStatus | null
    locationId: string | null
    ebayAccountId: string | null
    createdById: string | null
    title: string | null
    description: string | null
    category: string | null
    condition: string | null
    brand: string | null
    startingPrice: number | null
    buyNowPrice: number | null
    shippingCost: number | null
    ebayId: string | null
    publishedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ItemMaxAggregateOutputType = {
    id: string | null
    sku: string | null
    stage: $Enums.WorkflowStage | null
    status: $Enums.ItemStatus | null
    locationId: string | null
    ebayAccountId: string | null
    createdById: string | null
    title: string | null
    description: string | null
    category: string | null
    condition: string | null
    brand: string | null
    startingPrice: number | null
    buyNowPrice: number | null
    shippingCost: number | null
    ebayId: string | null
    publishedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ItemCountAggregateOutputType = {
    id: number
    sku: number
    stage: number
    status: number
    locationId: number
    ebayAccountId: number
    createdById: number
    title: number
    description: number
    category: number
    condition: number
    brand: number
    features: number
    keywords: number
    aiAnalysis: number
    startingPrice: number
    buyNowPrice: number
    shippingCost: number
    ebayId: number
    publishedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ItemAvgAggregateInputType = {
    startingPrice?: true
    buyNowPrice?: true
    shippingCost?: true
  }

  export type ItemSumAggregateInputType = {
    startingPrice?: true
    buyNowPrice?: true
    shippingCost?: true
  }

  export type ItemMinAggregateInputType = {
    id?: true
    sku?: true
    stage?: true
    status?: true
    locationId?: true
    ebayAccountId?: true
    createdById?: true
    title?: true
    description?: true
    category?: true
    condition?: true
    brand?: true
    startingPrice?: true
    buyNowPrice?: true
    shippingCost?: true
    ebayId?: true
    publishedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ItemMaxAggregateInputType = {
    id?: true
    sku?: true
    stage?: true
    status?: true
    locationId?: true
    ebayAccountId?: true
    createdById?: true
    title?: true
    description?: true
    category?: true
    condition?: true
    brand?: true
    startingPrice?: true
    buyNowPrice?: true
    shippingCost?: true
    ebayId?: true
    publishedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ItemCountAggregateInputType = {
    id?: true
    sku?: true
    stage?: true
    status?: true
    locationId?: true
    ebayAccountId?: true
    createdById?: true
    title?: true
    description?: true
    category?: true
    condition?: true
    brand?: true
    features?: true
    keywords?: true
    aiAnalysis?: true
    startingPrice?: true
    buyNowPrice?: true
    shippingCost?: true
    ebayId?: true
    publishedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Item to aggregate.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Items
    **/
    _count?: true | ItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ItemMaxAggregateInputType
  }

  export type GetItemAggregateType<T extends ItemAggregateArgs> = {
        [P in keyof T & keyof AggregateItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateItem[P]>
      : GetScalarType<T[P], AggregateItem[P]>
  }




  export type ItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithAggregationInput | ItemOrderByWithAggregationInput[]
    by: ItemScalarFieldEnum[] | ItemScalarFieldEnum
    having?: ItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ItemCountAggregateInputType | true
    _avg?: ItemAvgAggregateInputType
    _sum?: ItemSumAggregateInputType
    _min?: ItemMinAggregateInputType
    _max?: ItemMaxAggregateInputType
  }

  export type ItemGroupByOutputType = {
    id: string
    sku: string | null
    stage: $Enums.WorkflowStage
    status: $Enums.ItemStatus
    locationId: string
    ebayAccountId: string | null
    createdById: string
    title: string | null
    description: string | null
    category: string | null
    condition: string | null
    brand: string | null
    features: string[]
    keywords: string[]
    aiAnalysis: JsonValue | null
    startingPrice: number | null
    buyNowPrice: number | null
    shippingCost: number | null
    ebayId: string | null
    publishedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ItemCountAggregateOutputType | null
    _avg: ItemAvgAggregateOutputType | null
    _sum: ItemSumAggregateOutputType | null
    _min: ItemMinAggregateOutputType | null
    _max: ItemMaxAggregateOutputType | null
  }

  type GetItemGroupByPayload<T extends ItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ItemGroupByOutputType[P]>
            : GetScalarType<T[P], ItemGroupByOutputType[P]>
        }
      >
    >


  export type ItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sku?: boolean
    stage?: boolean
    status?: boolean
    locationId?: boolean
    ebayAccountId?: boolean
    createdById?: boolean
    title?: boolean
    description?: boolean
    category?: boolean
    condition?: boolean
    brand?: boolean
    features?: boolean
    keywords?: boolean
    aiAnalysis?: boolean
    startingPrice?: boolean
    buyNowPrice?: boolean
    shippingCost?: boolean
    ebayId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | LocationDefaultArgs<ExtArgs>
    ebayAccount?: boolean | Item$ebayAccountArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    photos?: boolean | Item$photosArgs<ExtArgs>
    workflowActions?: boolean | Item$workflowActionsArgs<ExtArgs>
    _count?: boolean | ItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["item"]>

  export type ItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sku?: boolean
    stage?: boolean
    status?: boolean
    locationId?: boolean
    ebayAccountId?: boolean
    createdById?: boolean
    title?: boolean
    description?: boolean
    category?: boolean
    condition?: boolean
    brand?: boolean
    features?: boolean
    keywords?: boolean
    aiAnalysis?: boolean
    startingPrice?: boolean
    buyNowPrice?: boolean
    shippingCost?: boolean
    ebayId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | LocationDefaultArgs<ExtArgs>
    ebayAccount?: boolean | Item$ebayAccountArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["item"]>

  export type ItemSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sku?: boolean
    stage?: boolean
    status?: boolean
    locationId?: boolean
    ebayAccountId?: boolean
    createdById?: boolean
    title?: boolean
    description?: boolean
    category?: boolean
    condition?: boolean
    brand?: boolean
    features?: boolean
    keywords?: boolean
    aiAnalysis?: boolean
    startingPrice?: boolean
    buyNowPrice?: boolean
    shippingCost?: boolean
    ebayId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    location?: boolean | LocationDefaultArgs<ExtArgs>
    ebayAccount?: boolean | Item$ebayAccountArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["item"]>

  export type ItemSelectScalar = {
    id?: boolean
    sku?: boolean
    stage?: boolean
    status?: boolean
    locationId?: boolean
    ebayAccountId?: boolean
    createdById?: boolean
    title?: boolean
    description?: boolean
    category?: boolean
    condition?: boolean
    brand?: boolean
    features?: boolean
    keywords?: boolean
    aiAnalysis?: boolean
    startingPrice?: boolean
    buyNowPrice?: boolean
    shippingCost?: boolean
    ebayId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ItemOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sku" | "stage" | "status" | "locationId" | "ebayAccountId" | "createdById" | "title" | "description" | "category" | "condition" | "brand" | "features" | "keywords" | "aiAnalysis" | "startingPrice" | "buyNowPrice" | "shippingCost" | "ebayId" | "publishedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["item"]>
  export type ItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | LocationDefaultArgs<ExtArgs>
    ebayAccount?: boolean | Item$ebayAccountArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
    photos?: boolean | Item$photosArgs<ExtArgs>
    workflowActions?: boolean | Item$workflowActionsArgs<ExtArgs>
    _count?: boolean | ItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | LocationDefaultArgs<ExtArgs>
    ebayAccount?: boolean | Item$ebayAccountArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ItemIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    location?: boolean | LocationDefaultArgs<ExtArgs>
    ebayAccount?: boolean | Item$ebayAccountArgs<ExtArgs>
    createdBy?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Item"
    objects: {
      location: Prisma.$LocationPayload<ExtArgs>
      ebayAccount: Prisma.$EbayAccountPayload<ExtArgs> | null
      createdBy: Prisma.$UserPayload<ExtArgs>
      photos: Prisma.$PhotoPayload<ExtArgs>[]
      workflowActions: Prisma.$WorkflowActionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sku: string | null
      stage: $Enums.WorkflowStage
      status: $Enums.ItemStatus
      locationId: string
      ebayAccountId: string | null
      createdById: string
      title: string | null
      description: string | null
      category: string | null
      condition: string | null
      brand: string | null
      features: string[]
      keywords: string[]
      aiAnalysis: Prisma.JsonValue | null
      startingPrice: number | null
      buyNowPrice: number | null
      shippingCost: number | null
      ebayId: string | null
      publishedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["item"]>
    composites: {}
  }

  type ItemGetPayload<S extends boolean | null | undefined | ItemDefaultArgs> = $Result.GetResult<Prisma.$ItemPayload, S>

  type ItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ItemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ItemCountAggregateInputType | true
    }

  export interface ItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Item'], meta: { name: 'Item' } }
    /**
     * Find zero or one Item that matches the filter.
     * @param {ItemFindUniqueArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ItemFindUniqueArgs>(args: SelectSubset<T, ItemFindUniqueArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Item that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ItemFindUniqueOrThrowArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ItemFindUniqueOrThrowArgs>(args: SelectSubset<T, ItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Item that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindFirstArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ItemFindFirstArgs>(args?: SelectSubset<T, ItemFindFirstArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Item that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindFirstOrThrowArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ItemFindFirstOrThrowArgs>(args?: SelectSubset<T, ItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Items that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Items
     * const items = await prisma.item.findMany()
     * 
     * // Get first 10 Items
     * const items = await prisma.item.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const itemWithIdOnly = await prisma.item.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ItemFindManyArgs>(args?: SelectSubset<T, ItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Item.
     * @param {ItemCreateArgs} args - Arguments to create a Item.
     * @example
     * // Create one Item
     * const Item = await prisma.item.create({
     *   data: {
     *     // ... data to create a Item
     *   }
     * })
     * 
     */
    create<T extends ItemCreateArgs>(args: SelectSubset<T, ItemCreateArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Items.
     * @param {ItemCreateManyArgs} args - Arguments to create many Items.
     * @example
     * // Create many Items
     * const item = await prisma.item.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ItemCreateManyArgs>(args?: SelectSubset<T, ItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Items and returns the data saved in the database.
     * @param {ItemCreateManyAndReturnArgs} args - Arguments to create many Items.
     * @example
     * // Create many Items
     * const item = await prisma.item.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Items and only return the `id`
     * const itemWithIdOnly = await prisma.item.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ItemCreateManyAndReturnArgs>(args?: SelectSubset<T, ItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Item.
     * @param {ItemDeleteArgs} args - Arguments to delete one Item.
     * @example
     * // Delete one Item
     * const Item = await prisma.item.delete({
     *   where: {
     *     // ... filter to delete one Item
     *   }
     * })
     * 
     */
    delete<T extends ItemDeleteArgs>(args: SelectSubset<T, ItemDeleteArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Item.
     * @param {ItemUpdateArgs} args - Arguments to update one Item.
     * @example
     * // Update one Item
     * const item = await prisma.item.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ItemUpdateArgs>(args: SelectSubset<T, ItemUpdateArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Items.
     * @param {ItemDeleteManyArgs} args - Arguments to filter Items to delete.
     * @example
     * // Delete a few Items
     * const { count } = await prisma.item.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ItemDeleteManyArgs>(args?: SelectSubset<T, ItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Items.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Items
     * const item = await prisma.item.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ItemUpdateManyArgs>(args: SelectSubset<T, ItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Items and returns the data updated in the database.
     * @param {ItemUpdateManyAndReturnArgs} args - Arguments to update many Items.
     * @example
     * // Update many Items
     * const item = await prisma.item.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Items and only return the `id`
     * const itemWithIdOnly = await prisma.item.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ItemUpdateManyAndReturnArgs>(args: SelectSubset<T, ItemUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Item.
     * @param {ItemUpsertArgs} args - Arguments to update or create a Item.
     * @example
     * // Update or create a Item
     * const item = await prisma.item.upsert({
     *   create: {
     *     // ... data to create a Item
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Item we want to update
     *   }
     * })
     */
    upsert<T extends ItemUpsertArgs>(args: SelectSubset<T, ItemUpsertArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Items.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCountArgs} args - Arguments to filter Items to count.
     * @example
     * // Count the number of Items
     * const count = await prisma.item.count({
     *   where: {
     *     // ... the filter for the Items we want to count
     *   }
     * })
    **/
    count<T extends ItemCountArgs>(
      args?: Subset<T, ItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Item.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ItemAggregateArgs>(args: Subset<T, ItemAggregateArgs>): Prisma.PrismaPromise<GetItemAggregateType<T>>

    /**
     * Group by Item.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ItemGroupByArgs['orderBy'] }
        : { orderBy?: ItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Item model
   */
  readonly fields: ItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Item.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    location<T extends LocationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LocationDefaultArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    ebayAccount<T extends Item$ebayAccountArgs<ExtArgs> = {}>(args?: Subset<T, Item$ebayAccountArgs<ExtArgs>>): Prisma__EbayAccountClient<$Result.GetResult<Prisma.$EbayAccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    createdBy<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    photos<T extends Item$photosArgs<ExtArgs> = {}>(args?: Subset<T, Item$photosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    workflowActions<T extends Item$workflowActionsArgs<ExtArgs> = {}>(args?: Subset<T, Item$workflowActionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Item model
   */
  interface ItemFieldRefs {
    readonly id: FieldRef<"Item", 'String'>
    readonly sku: FieldRef<"Item", 'String'>
    readonly stage: FieldRef<"Item", 'WorkflowStage'>
    readonly status: FieldRef<"Item", 'ItemStatus'>
    readonly locationId: FieldRef<"Item", 'String'>
    readonly ebayAccountId: FieldRef<"Item", 'String'>
    readonly createdById: FieldRef<"Item", 'String'>
    readonly title: FieldRef<"Item", 'String'>
    readonly description: FieldRef<"Item", 'String'>
    readonly category: FieldRef<"Item", 'String'>
    readonly condition: FieldRef<"Item", 'String'>
    readonly brand: FieldRef<"Item", 'String'>
    readonly features: FieldRef<"Item", 'String[]'>
    readonly keywords: FieldRef<"Item", 'String[]'>
    readonly aiAnalysis: FieldRef<"Item", 'Json'>
    readonly startingPrice: FieldRef<"Item", 'Float'>
    readonly buyNowPrice: FieldRef<"Item", 'Float'>
    readonly shippingCost: FieldRef<"Item", 'Float'>
    readonly ebayId: FieldRef<"Item", 'String'>
    readonly publishedAt: FieldRef<"Item", 'DateTime'>
    readonly createdAt: FieldRef<"Item", 'DateTime'>
    readonly updatedAt: FieldRef<"Item", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Item findUnique
   */
  export type ItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item findUniqueOrThrow
   */
  export type ItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item findFirst
   */
  export type ItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Items.
     */
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item findFirstOrThrow
   */
  export type ItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Items.
     */
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item findMany
   */
  export type ItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Items to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item create
   */
  export type ItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The data needed to create a Item.
     */
    data: XOR<ItemCreateInput, ItemUncheckedCreateInput>
  }

  /**
   * Item createMany
   */
  export type ItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Items.
     */
    data: ItemCreateManyInput | ItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Item createManyAndReturn
   */
  export type ItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * The data used to create many Items.
     */
    data: ItemCreateManyInput | ItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Item update
   */
  export type ItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The data needed to update a Item.
     */
    data: XOR<ItemUpdateInput, ItemUncheckedUpdateInput>
    /**
     * Choose, which Item to update.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item updateMany
   */
  export type ItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Items.
     */
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyInput>
    /**
     * Filter which Items to update
     */
    where?: ItemWhereInput
    /**
     * Limit how many Items to update.
     */
    limit?: number
  }

  /**
   * Item updateManyAndReturn
   */
  export type ItemUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * The data used to update Items.
     */
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyInput>
    /**
     * Filter which Items to update
     */
    where?: ItemWhereInput
    /**
     * Limit how many Items to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Item upsert
   */
  export type ItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The filter to search for the Item to update in case it exists.
     */
    where: ItemWhereUniqueInput
    /**
     * In case the Item found by the `where` argument doesn't exist, create a new Item with this data.
     */
    create: XOR<ItemCreateInput, ItemUncheckedCreateInput>
    /**
     * In case the Item was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ItemUpdateInput, ItemUncheckedUpdateInput>
  }

  /**
   * Item delete
   */
  export type ItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter which Item to delete.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item deleteMany
   */
  export type ItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Items to delete
     */
    where?: ItemWhereInput
    /**
     * Limit how many Items to delete.
     */
    limit?: number
  }

  /**
   * Item.ebayAccount
   */
  export type Item$ebayAccountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EbayAccount
     */
    select?: EbayAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EbayAccount
     */
    omit?: EbayAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EbayAccountInclude<ExtArgs> | null
    where?: EbayAccountWhereInput
  }

  /**
   * Item.photos
   */
  export type Item$photosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    where?: PhotoWhereInput
    orderBy?: PhotoOrderByWithRelationInput | PhotoOrderByWithRelationInput[]
    cursor?: PhotoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PhotoScalarFieldEnum | PhotoScalarFieldEnum[]
  }

  /**
   * Item.workflowActions
   */
  export type Item$workflowActionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    where?: WorkflowActionWhereInput
    orderBy?: WorkflowActionOrderByWithRelationInput | WorkflowActionOrderByWithRelationInput[]
    cursor?: WorkflowActionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: WorkflowActionScalarFieldEnum | WorkflowActionScalarFieldEnum[]
  }

  /**
   * Item without action
   */
  export type ItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
  }


  /**
   * Model UserSession
   */

  export type AggregateUserSession = {
    _count: UserSessionCountAggregateOutputType | null
    _min: UserSessionMinAggregateOutputType | null
    _max: UserSessionMaxAggregateOutputType | null
  }

  export type UserSessionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type UserSessionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type UserSessionCountAggregateOutputType = {
    id: number
    userId: number
    token: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type UserSessionMinAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type UserSessionMaxAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type UserSessionCountAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type UserSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserSession to aggregate.
     */
    where?: UserSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserSessions to fetch.
     */
    orderBy?: UserSessionOrderByWithRelationInput | UserSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UserSessions
    **/
    _count?: true | UserSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserSessionMaxAggregateInputType
  }

  export type GetUserSessionAggregateType<T extends UserSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateUserSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserSession[P]>
      : GetScalarType<T[P], AggregateUserSession[P]>
  }




  export type UserSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserSessionWhereInput
    orderBy?: UserSessionOrderByWithAggregationInput | UserSessionOrderByWithAggregationInput[]
    by: UserSessionScalarFieldEnum[] | UserSessionScalarFieldEnum
    having?: UserSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserSessionCountAggregateInputType | true
    _min?: UserSessionMinAggregateInputType
    _max?: UserSessionMaxAggregateInputType
  }

  export type UserSessionGroupByOutputType = {
    id: string
    userId: string
    token: string
    expiresAt: Date
    createdAt: Date
    _count: UserSessionCountAggregateOutputType | null
    _min: UserSessionMinAggregateOutputType | null
    _max: UserSessionMaxAggregateOutputType | null
  }

  type GetUserSessionGroupByPayload<T extends UserSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserSessionGroupByOutputType[P]>
            : GetScalarType<T[P], UserSessionGroupByOutputType[P]>
        }
      >
    >


  export type UserSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userSession"]>

  export type UserSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userSession"]>

  export type UserSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["userSession"]>

  export type UserSessionSelectScalar = {
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type UserSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "token" | "expiresAt" | "createdAt", ExtArgs["result"]["userSession"]>
  export type UserSessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserSessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UserSessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $UserSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UserSession"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      token: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["userSession"]>
    composites: {}
  }

  type UserSessionGetPayload<S extends boolean | null | undefined | UserSessionDefaultArgs> = $Result.GetResult<Prisma.$UserSessionPayload, S>

  type UserSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserSessionCountAggregateInputType | true
    }

  export interface UserSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserSession'], meta: { name: 'UserSession' } }
    /**
     * Find zero or one UserSession that matches the filter.
     * @param {UserSessionFindUniqueArgs} args - Arguments to find a UserSession
     * @example
     * // Get one UserSession
     * const userSession = await prisma.userSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserSessionFindUniqueArgs>(args: SelectSubset<T, UserSessionFindUniqueArgs<ExtArgs>>): Prisma__UserSessionClient<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UserSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserSessionFindUniqueOrThrowArgs} args - Arguments to find a UserSession
     * @example
     * // Get one UserSession
     * const userSession = await prisma.userSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, UserSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserSessionClient<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSessionFindFirstArgs} args - Arguments to find a UserSession
     * @example
     * // Get one UserSession
     * const userSession = await prisma.userSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserSessionFindFirstArgs>(args?: SelectSubset<T, UserSessionFindFirstArgs<ExtArgs>>): Prisma__UserSessionClient<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UserSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSessionFindFirstOrThrowArgs} args - Arguments to find a UserSession
     * @example
     * // Get one UserSession
     * const userSession = await prisma.userSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, UserSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserSessionClient<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UserSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserSessions
     * const userSessions = await prisma.userSession.findMany()
     * 
     * // Get first 10 UserSessions
     * const userSessions = await prisma.userSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userSessionWithIdOnly = await prisma.userSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserSessionFindManyArgs>(args?: SelectSubset<T, UserSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UserSession.
     * @param {UserSessionCreateArgs} args - Arguments to create a UserSession.
     * @example
     * // Create one UserSession
     * const UserSession = await prisma.userSession.create({
     *   data: {
     *     // ... data to create a UserSession
     *   }
     * })
     * 
     */
    create<T extends UserSessionCreateArgs>(args: SelectSubset<T, UserSessionCreateArgs<ExtArgs>>): Prisma__UserSessionClient<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UserSessions.
     * @param {UserSessionCreateManyArgs} args - Arguments to create many UserSessions.
     * @example
     * // Create many UserSessions
     * const userSession = await prisma.userSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserSessionCreateManyArgs>(args?: SelectSubset<T, UserSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UserSessions and returns the data saved in the database.
     * @param {UserSessionCreateManyAndReturnArgs} args - Arguments to create many UserSessions.
     * @example
     * // Create many UserSessions
     * const userSession = await prisma.userSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UserSessions and only return the `id`
     * const userSessionWithIdOnly = await prisma.userSession.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, UserSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UserSession.
     * @param {UserSessionDeleteArgs} args - Arguments to delete one UserSession.
     * @example
     * // Delete one UserSession
     * const UserSession = await prisma.userSession.delete({
     *   where: {
     *     // ... filter to delete one UserSession
     *   }
     * })
     * 
     */
    delete<T extends UserSessionDeleteArgs>(args: SelectSubset<T, UserSessionDeleteArgs<ExtArgs>>): Prisma__UserSessionClient<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UserSession.
     * @param {UserSessionUpdateArgs} args - Arguments to update one UserSession.
     * @example
     * // Update one UserSession
     * const userSession = await prisma.userSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserSessionUpdateArgs>(args: SelectSubset<T, UserSessionUpdateArgs<ExtArgs>>): Prisma__UserSessionClient<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UserSessions.
     * @param {UserSessionDeleteManyArgs} args - Arguments to filter UserSessions to delete.
     * @example
     * // Delete a few UserSessions
     * const { count } = await prisma.userSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserSessionDeleteManyArgs>(args?: SelectSubset<T, UserSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserSessions
     * const userSession = await prisma.userSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserSessionUpdateManyArgs>(args: SelectSubset<T, UserSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UserSessions and returns the data updated in the database.
     * @param {UserSessionUpdateManyAndReturnArgs} args - Arguments to update many UserSessions.
     * @example
     * // Update many UserSessions
     * const userSession = await prisma.userSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UserSessions and only return the `id`
     * const userSessionWithIdOnly = await prisma.userSession.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, UserSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UserSession.
     * @param {UserSessionUpsertArgs} args - Arguments to update or create a UserSession.
     * @example
     * // Update or create a UserSession
     * const userSession = await prisma.userSession.upsert({
     *   create: {
     *     // ... data to create a UserSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserSession we want to update
     *   }
     * })
     */
    upsert<T extends UserSessionUpsertArgs>(args: SelectSubset<T, UserSessionUpsertArgs<ExtArgs>>): Prisma__UserSessionClient<$Result.GetResult<Prisma.$UserSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UserSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSessionCountArgs} args - Arguments to filter UserSessions to count.
     * @example
     * // Count the number of UserSessions
     * const count = await prisma.userSession.count({
     *   where: {
     *     // ... the filter for the UserSessions we want to count
     *   }
     * })
    **/
    count<T extends UserSessionCountArgs>(
      args?: Subset<T, UserSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UserSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserSessionAggregateArgs>(args: Subset<T, UserSessionAggregateArgs>): Prisma.PrismaPromise<GetUserSessionAggregateType<T>>

    /**
     * Group by UserSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserSessionGroupByArgs['orderBy'] }
        : { orderBy?: UserSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UserSession model
   */
  readonly fields: UserSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UserSession model
   */
  interface UserSessionFieldRefs {
    readonly id: FieldRef<"UserSession", 'String'>
    readonly userId: FieldRef<"UserSession", 'String'>
    readonly token: FieldRef<"UserSession", 'String'>
    readonly expiresAt: FieldRef<"UserSession", 'DateTime'>
    readonly createdAt: FieldRef<"UserSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UserSession findUnique
   */
  export type UserSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * Filter, which UserSession to fetch.
     */
    where: UserSessionWhereUniqueInput
  }

  /**
   * UserSession findUniqueOrThrow
   */
  export type UserSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * Filter, which UserSession to fetch.
     */
    where: UserSessionWhereUniqueInput
  }

  /**
   * UserSession findFirst
   */
  export type UserSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * Filter, which UserSession to fetch.
     */
    where?: UserSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserSessions to fetch.
     */
    orderBy?: UserSessionOrderByWithRelationInput | UserSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserSessions.
     */
    cursor?: UserSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserSessions.
     */
    distinct?: UserSessionScalarFieldEnum | UserSessionScalarFieldEnum[]
  }

  /**
   * UserSession findFirstOrThrow
   */
  export type UserSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * Filter, which UserSession to fetch.
     */
    where?: UserSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserSessions to fetch.
     */
    orderBy?: UserSessionOrderByWithRelationInput | UserSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UserSessions.
     */
    cursor?: UserSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UserSessions.
     */
    distinct?: UserSessionScalarFieldEnum | UserSessionScalarFieldEnum[]
  }

  /**
   * UserSession findMany
   */
  export type UserSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * Filter, which UserSessions to fetch.
     */
    where?: UserSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UserSessions to fetch.
     */
    orderBy?: UserSessionOrderByWithRelationInput | UserSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UserSessions.
     */
    cursor?: UserSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UserSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UserSessions.
     */
    skip?: number
    distinct?: UserSessionScalarFieldEnum | UserSessionScalarFieldEnum[]
  }

  /**
   * UserSession create
   */
  export type UserSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * The data needed to create a UserSession.
     */
    data: XOR<UserSessionCreateInput, UserSessionUncheckedCreateInput>
  }

  /**
   * UserSession createMany
   */
  export type UserSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserSessions.
     */
    data: UserSessionCreateManyInput | UserSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UserSession createManyAndReturn
   */
  export type UserSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * The data used to create many UserSessions.
     */
    data: UserSessionCreateManyInput | UserSessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserSession update
   */
  export type UserSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * The data needed to update a UserSession.
     */
    data: XOR<UserSessionUpdateInput, UserSessionUncheckedUpdateInput>
    /**
     * Choose, which UserSession to update.
     */
    where: UserSessionWhereUniqueInput
  }

  /**
   * UserSession updateMany
   */
  export type UserSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserSessions.
     */
    data: XOR<UserSessionUpdateManyMutationInput, UserSessionUncheckedUpdateManyInput>
    /**
     * Filter which UserSessions to update
     */
    where?: UserSessionWhereInput
    /**
     * Limit how many UserSessions to update.
     */
    limit?: number
  }

  /**
   * UserSession updateManyAndReturn
   */
  export type UserSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * The data used to update UserSessions.
     */
    data: XOR<UserSessionUpdateManyMutationInput, UserSessionUncheckedUpdateManyInput>
    /**
     * Filter which UserSessions to update
     */
    where?: UserSessionWhereInput
    /**
     * Limit how many UserSessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * UserSession upsert
   */
  export type UserSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * The filter to search for the UserSession to update in case it exists.
     */
    where: UserSessionWhereUniqueInput
    /**
     * In case the UserSession found by the `where` argument doesn't exist, create a new UserSession with this data.
     */
    create: XOR<UserSessionCreateInput, UserSessionUncheckedCreateInput>
    /**
     * In case the UserSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserSessionUpdateInput, UserSessionUncheckedUpdateInput>
  }

  /**
   * UserSession delete
   */
  export type UserSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
    /**
     * Filter which UserSession to delete.
     */
    where: UserSessionWhereUniqueInput
  }

  /**
   * UserSession deleteMany
   */
  export type UserSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserSessions to delete
     */
    where?: UserSessionWhereInput
    /**
     * Limit how many UserSessions to delete.
     */
    limit?: number
  }

  /**
   * UserSession without action
   */
  export type UserSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserSession
     */
    select?: UserSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UserSession
     */
    omit?: UserSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserSessionInclude<ExtArgs> | null
  }


  /**
   * Model Photo
   */

  export type AggregatePhoto = {
    _count: PhotoCountAggregateOutputType | null
    _avg: PhotoAvgAggregateOutputType | null
    _sum: PhotoSumAggregateOutputType | null
    _min: PhotoMinAggregateOutputType | null
    _max: PhotoMaxAggregateOutputType | null
  }

  export type PhotoAvgAggregateOutputType = {
    order: number | null
  }

  export type PhotoSumAggregateOutputType = {
    order: number | null
  }

  export type PhotoMinAggregateOutputType = {
    id: string | null
    itemId: string | null
    originalPath: string | null
    thumbnailPath: string | null
    optimizedPath: string | null
    isPrimary: boolean | null
    order: number | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PhotoMaxAggregateOutputType = {
    id: string | null
    itemId: string | null
    originalPath: string | null
    thumbnailPath: string | null
    optimizedPath: string | null
    isPrimary: boolean | null
    order: number | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PhotoCountAggregateOutputType = {
    id: number
    itemId: number
    originalPath: number
    thumbnailPath: number
    optimizedPath: number
    isPrimary: number
    order: number
    analysis: number
    processedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PhotoAvgAggregateInputType = {
    order?: true
  }

  export type PhotoSumAggregateInputType = {
    order?: true
  }

  export type PhotoMinAggregateInputType = {
    id?: true
    itemId?: true
    originalPath?: true
    thumbnailPath?: true
    optimizedPath?: true
    isPrimary?: true
    order?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PhotoMaxAggregateInputType = {
    id?: true
    itemId?: true
    originalPath?: true
    thumbnailPath?: true
    optimizedPath?: true
    isPrimary?: true
    order?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PhotoCountAggregateInputType = {
    id?: true
    itemId?: true
    originalPath?: true
    thumbnailPath?: true
    optimizedPath?: true
    isPrimary?: true
    order?: true
    analysis?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PhotoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Photo to aggregate.
     */
    where?: PhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Photos to fetch.
     */
    orderBy?: PhotoOrderByWithRelationInput | PhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Photos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Photos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Photos
    **/
    _count?: true | PhotoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PhotoAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PhotoSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PhotoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PhotoMaxAggregateInputType
  }

  export type GetPhotoAggregateType<T extends PhotoAggregateArgs> = {
        [P in keyof T & keyof AggregatePhoto]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePhoto[P]>
      : GetScalarType<T[P], AggregatePhoto[P]>
  }




  export type PhotoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PhotoWhereInput
    orderBy?: PhotoOrderByWithAggregationInput | PhotoOrderByWithAggregationInput[]
    by: PhotoScalarFieldEnum[] | PhotoScalarFieldEnum
    having?: PhotoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PhotoCountAggregateInputType | true
    _avg?: PhotoAvgAggregateInputType
    _sum?: PhotoSumAggregateInputType
    _min?: PhotoMinAggregateInputType
    _max?: PhotoMaxAggregateInputType
  }

  export type PhotoGroupByOutputType = {
    id: string
    itemId: string
    originalPath: string
    thumbnailPath: string | null
    optimizedPath: string | null
    isPrimary: boolean
    order: number
    analysis: JsonValue | null
    processedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: PhotoCountAggregateOutputType | null
    _avg: PhotoAvgAggregateOutputType | null
    _sum: PhotoSumAggregateOutputType | null
    _min: PhotoMinAggregateOutputType | null
    _max: PhotoMaxAggregateOutputType | null
  }

  type GetPhotoGroupByPayload<T extends PhotoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PhotoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PhotoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PhotoGroupByOutputType[P]>
            : GetScalarType<T[P], PhotoGroupByOutputType[P]>
        }
      >
    >


  export type PhotoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    originalPath?: boolean
    thumbnailPath?: boolean
    optimizedPath?: boolean
    isPrimary?: boolean
    order?: boolean
    analysis?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["photo"]>

  export type PhotoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    originalPath?: boolean
    thumbnailPath?: boolean
    optimizedPath?: boolean
    isPrimary?: boolean
    order?: boolean
    analysis?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["photo"]>

  export type PhotoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    originalPath?: boolean
    thumbnailPath?: boolean
    optimizedPath?: boolean
    isPrimary?: boolean
    order?: boolean
    analysis?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["photo"]>

  export type PhotoSelectScalar = {
    id?: boolean
    itemId?: boolean
    originalPath?: boolean
    thumbnailPath?: boolean
    optimizedPath?: boolean
    isPrimary?: boolean
    order?: boolean
    analysis?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PhotoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "itemId" | "originalPath" | "thumbnailPath" | "optimizedPath" | "isPrimary" | "order" | "analysis" | "processedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["photo"]>
  export type PhotoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }
  export type PhotoIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }
  export type PhotoIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }

  export type $PhotoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Photo"
    objects: {
      item: Prisma.$ItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      itemId: string
      originalPath: string
      thumbnailPath: string | null
      optimizedPath: string | null
      isPrimary: boolean
      order: number
      analysis: Prisma.JsonValue | null
      processedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["photo"]>
    composites: {}
  }

  type PhotoGetPayload<S extends boolean | null | undefined | PhotoDefaultArgs> = $Result.GetResult<Prisma.$PhotoPayload, S>

  type PhotoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PhotoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PhotoCountAggregateInputType | true
    }

  export interface PhotoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Photo'], meta: { name: 'Photo' } }
    /**
     * Find zero or one Photo that matches the filter.
     * @param {PhotoFindUniqueArgs} args - Arguments to find a Photo
     * @example
     * // Get one Photo
     * const photo = await prisma.photo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PhotoFindUniqueArgs>(args: SelectSubset<T, PhotoFindUniqueArgs<ExtArgs>>): Prisma__PhotoClient<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Photo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PhotoFindUniqueOrThrowArgs} args - Arguments to find a Photo
     * @example
     * // Get one Photo
     * const photo = await prisma.photo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PhotoFindUniqueOrThrowArgs>(args: SelectSubset<T, PhotoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PhotoClient<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Photo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoFindFirstArgs} args - Arguments to find a Photo
     * @example
     * // Get one Photo
     * const photo = await prisma.photo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PhotoFindFirstArgs>(args?: SelectSubset<T, PhotoFindFirstArgs<ExtArgs>>): Prisma__PhotoClient<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Photo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoFindFirstOrThrowArgs} args - Arguments to find a Photo
     * @example
     * // Get one Photo
     * const photo = await prisma.photo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PhotoFindFirstOrThrowArgs>(args?: SelectSubset<T, PhotoFindFirstOrThrowArgs<ExtArgs>>): Prisma__PhotoClient<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Photos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Photos
     * const photos = await prisma.photo.findMany()
     * 
     * // Get first 10 Photos
     * const photos = await prisma.photo.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const photoWithIdOnly = await prisma.photo.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PhotoFindManyArgs>(args?: SelectSubset<T, PhotoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Photo.
     * @param {PhotoCreateArgs} args - Arguments to create a Photo.
     * @example
     * // Create one Photo
     * const Photo = await prisma.photo.create({
     *   data: {
     *     // ... data to create a Photo
     *   }
     * })
     * 
     */
    create<T extends PhotoCreateArgs>(args: SelectSubset<T, PhotoCreateArgs<ExtArgs>>): Prisma__PhotoClient<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Photos.
     * @param {PhotoCreateManyArgs} args - Arguments to create many Photos.
     * @example
     * // Create many Photos
     * const photo = await prisma.photo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PhotoCreateManyArgs>(args?: SelectSubset<T, PhotoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Photos and returns the data saved in the database.
     * @param {PhotoCreateManyAndReturnArgs} args - Arguments to create many Photos.
     * @example
     * // Create many Photos
     * const photo = await prisma.photo.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Photos and only return the `id`
     * const photoWithIdOnly = await prisma.photo.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PhotoCreateManyAndReturnArgs>(args?: SelectSubset<T, PhotoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Photo.
     * @param {PhotoDeleteArgs} args - Arguments to delete one Photo.
     * @example
     * // Delete one Photo
     * const Photo = await prisma.photo.delete({
     *   where: {
     *     // ... filter to delete one Photo
     *   }
     * })
     * 
     */
    delete<T extends PhotoDeleteArgs>(args: SelectSubset<T, PhotoDeleteArgs<ExtArgs>>): Prisma__PhotoClient<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Photo.
     * @param {PhotoUpdateArgs} args - Arguments to update one Photo.
     * @example
     * // Update one Photo
     * const photo = await prisma.photo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PhotoUpdateArgs>(args: SelectSubset<T, PhotoUpdateArgs<ExtArgs>>): Prisma__PhotoClient<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Photos.
     * @param {PhotoDeleteManyArgs} args - Arguments to filter Photos to delete.
     * @example
     * // Delete a few Photos
     * const { count } = await prisma.photo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PhotoDeleteManyArgs>(args?: SelectSubset<T, PhotoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Photos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Photos
     * const photo = await prisma.photo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PhotoUpdateManyArgs>(args: SelectSubset<T, PhotoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Photos and returns the data updated in the database.
     * @param {PhotoUpdateManyAndReturnArgs} args - Arguments to update many Photos.
     * @example
     * // Update many Photos
     * const photo = await prisma.photo.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Photos and only return the `id`
     * const photoWithIdOnly = await prisma.photo.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PhotoUpdateManyAndReturnArgs>(args: SelectSubset<T, PhotoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Photo.
     * @param {PhotoUpsertArgs} args - Arguments to update or create a Photo.
     * @example
     * // Update or create a Photo
     * const photo = await prisma.photo.upsert({
     *   create: {
     *     // ... data to create a Photo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Photo we want to update
     *   }
     * })
     */
    upsert<T extends PhotoUpsertArgs>(args: SelectSubset<T, PhotoUpsertArgs<ExtArgs>>): Prisma__PhotoClient<$Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Photos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoCountArgs} args - Arguments to filter Photos to count.
     * @example
     * // Count the number of Photos
     * const count = await prisma.photo.count({
     *   where: {
     *     // ... the filter for the Photos we want to count
     *   }
     * })
    **/
    count<T extends PhotoCountArgs>(
      args?: Subset<T, PhotoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PhotoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Photo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PhotoAggregateArgs>(args: Subset<T, PhotoAggregateArgs>): Prisma.PrismaPromise<GetPhotoAggregateType<T>>

    /**
     * Group by Photo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PhotoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PhotoGroupByArgs['orderBy'] }
        : { orderBy?: PhotoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PhotoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPhotoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Photo model
   */
  readonly fields: PhotoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Photo.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PhotoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    item<T extends ItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ItemDefaultArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Photo model
   */
  interface PhotoFieldRefs {
    readonly id: FieldRef<"Photo", 'String'>
    readonly itemId: FieldRef<"Photo", 'String'>
    readonly originalPath: FieldRef<"Photo", 'String'>
    readonly thumbnailPath: FieldRef<"Photo", 'String'>
    readonly optimizedPath: FieldRef<"Photo", 'String'>
    readonly isPrimary: FieldRef<"Photo", 'Boolean'>
    readonly order: FieldRef<"Photo", 'Int'>
    readonly analysis: FieldRef<"Photo", 'Json'>
    readonly processedAt: FieldRef<"Photo", 'DateTime'>
    readonly createdAt: FieldRef<"Photo", 'DateTime'>
    readonly updatedAt: FieldRef<"Photo", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Photo findUnique
   */
  export type PhotoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * Filter, which Photo to fetch.
     */
    where: PhotoWhereUniqueInput
  }

  /**
   * Photo findUniqueOrThrow
   */
  export type PhotoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * Filter, which Photo to fetch.
     */
    where: PhotoWhereUniqueInput
  }

  /**
   * Photo findFirst
   */
  export type PhotoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * Filter, which Photo to fetch.
     */
    where?: PhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Photos to fetch.
     */
    orderBy?: PhotoOrderByWithRelationInput | PhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Photos.
     */
    cursor?: PhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Photos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Photos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Photos.
     */
    distinct?: PhotoScalarFieldEnum | PhotoScalarFieldEnum[]
  }

  /**
   * Photo findFirstOrThrow
   */
  export type PhotoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * Filter, which Photo to fetch.
     */
    where?: PhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Photos to fetch.
     */
    orderBy?: PhotoOrderByWithRelationInput | PhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Photos.
     */
    cursor?: PhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Photos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Photos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Photos.
     */
    distinct?: PhotoScalarFieldEnum | PhotoScalarFieldEnum[]
  }

  /**
   * Photo findMany
   */
  export type PhotoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * Filter, which Photos to fetch.
     */
    where?: PhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Photos to fetch.
     */
    orderBy?: PhotoOrderByWithRelationInput | PhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Photos.
     */
    cursor?: PhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Photos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Photos.
     */
    skip?: number
    distinct?: PhotoScalarFieldEnum | PhotoScalarFieldEnum[]
  }

  /**
   * Photo create
   */
  export type PhotoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * The data needed to create a Photo.
     */
    data: XOR<PhotoCreateInput, PhotoUncheckedCreateInput>
  }

  /**
   * Photo createMany
   */
  export type PhotoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Photos.
     */
    data: PhotoCreateManyInput | PhotoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Photo createManyAndReturn
   */
  export type PhotoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * The data used to create many Photos.
     */
    data: PhotoCreateManyInput | PhotoCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Photo update
   */
  export type PhotoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * The data needed to update a Photo.
     */
    data: XOR<PhotoUpdateInput, PhotoUncheckedUpdateInput>
    /**
     * Choose, which Photo to update.
     */
    where: PhotoWhereUniqueInput
  }

  /**
   * Photo updateMany
   */
  export type PhotoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Photos.
     */
    data: XOR<PhotoUpdateManyMutationInput, PhotoUncheckedUpdateManyInput>
    /**
     * Filter which Photos to update
     */
    where?: PhotoWhereInput
    /**
     * Limit how many Photos to update.
     */
    limit?: number
  }

  /**
   * Photo updateManyAndReturn
   */
  export type PhotoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * The data used to update Photos.
     */
    data: XOR<PhotoUpdateManyMutationInput, PhotoUncheckedUpdateManyInput>
    /**
     * Filter which Photos to update
     */
    where?: PhotoWhereInput
    /**
     * Limit how many Photos to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Photo upsert
   */
  export type PhotoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * The filter to search for the Photo to update in case it exists.
     */
    where: PhotoWhereUniqueInput
    /**
     * In case the Photo found by the `where` argument doesn't exist, create a new Photo with this data.
     */
    create: XOR<PhotoCreateInput, PhotoUncheckedCreateInput>
    /**
     * In case the Photo was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PhotoUpdateInput, PhotoUncheckedUpdateInput>
  }

  /**
   * Photo delete
   */
  export type PhotoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
    /**
     * Filter which Photo to delete.
     */
    where: PhotoWhereUniqueInput
  }

  /**
   * Photo deleteMany
   */
  export type PhotoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Photos to delete
     */
    where?: PhotoWhereInput
    /**
     * Limit how many Photos to delete.
     */
    limit?: number
  }

  /**
   * Photo without action
   */
  export type PhotoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: PhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Photo
     */
    omit?: PhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PhotoInclude<ExtArgs> | null
  }


  /**
   * Model WorkflowAction
   */

  export type AggregateWorkflowAction = {
    _count: WorkflowActionCountAggregateOutputType | null
    _min: WorkflowActionMinAggregateOutputType | null
    _max: WorkflowActionMaxAggregateOutputType | null
  }

  export type WorkflowActionMinAggregateOutputType = {
    id: string | null
    itemId: string | null
    userId: string | null
    fromStage: $Enums.WorkflowStage | null
    toStage: $Enums.WorkflowStage | null
    action: string | null
    notes: string | null
    createdAt: Date | null
  }

  export type WorkflowActionMaxAggregateOutputType = {
    id: string | null
    itemId: string | null
    userId: string | null
    fromStage: $Enums.WorkflowStage | null
    toStage: $Enums.WorkflowStage | null
    action: string | null
    notes: string | null
    createdAt: Date | null
  }

  export type WorkflowActionCountAggregateOutputType = {
    id: number
    itemId: number
    userId: number
    fromStage: number
    toStage: number
    action: number
    notes: number
    changes: number
    createdAt: number
    _all: number
  }


  export type WorkflowActionMinAggregateInputType = {
    id?: true
    itemId?: true
    userId?: true
    fromStage?: true
    toStage?: true
    action?: true
    notes?: true
    createdAt?: true
  }

  export type WorkflowActionMaxAggregateInputType = {
    id?: true
    itemId?: true
    userId?: true
    fromStage?: true
    toStage?: true
    action?: true
    notes?: true
    createdAt?: true
  }

  export type WorkflowActionCountAggregateInputType = {
    id?: true
    itemId?: true
    userId?: true
    fromStage?: true
    toStage?: true
    action?: true
    notes?: true
    changes?: true
    createdAt?: true
    _all?: true
  }

  export type WorkflowActionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkflowAction to aggregate.
     */
    where?: WorkflowActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkflowActions to fetch.
     */
    orderBy?: WorkflowActionOrderByWithRelationInput | WorkflowActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkflowActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkflowActions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkflowActions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkflowActions
    **/
    _count?: true | WorkflowActionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkflowActionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkflowActionMaxAggregateInputType
  }

  export type GetWorkflowActionAggregateType<T extends WorkflowActionAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkflowAction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkflowAction[P]>
      : GetScalarType<T[P], AggregateWorkflowAction[P]>
  }




  export type WorkflowActionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkflowActionWhereInput
    orderBy?: WorkflowActionOrderByWithAggregationInput | WorkflowActionOrderByWithAggregationInput[]
    by: WorkflowActionScalarFieldEnum[] | WorkflowActionScalarFieldEnum
    having?: WorkflowActionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkflowActionCountAggregateInputType | true
    _min?: WorkflowActionMinAggregateInputType
    _max?: WorkflowActionMaxAggregateInputType
  }

  export type WorkflowActionGroupByOutputType = {
    id: string
    itemId: string
    userId: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes: string | null
    changes: JsonValue | null
    createdAt: Date
    _count: WorkflowActionCountAggregateOutputType | null
    _min: WorkflowActionMinAggregateOutputType | null
    _max: WorkflowActionMaxAggregateOutputType | null
  }

  type GetWorkflowActionGroupByPayload<T extends WorkflowActionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkflowActionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkflowActionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkflowActionGroupByOutputType[P]>
            : GetScalarType<T[P], WorkflowActionGroupByOutputType[P]>
        }
      >
    >


  export type WorkflowActionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    userId?: boolean
    fromStage?: boolean
    toStage?: boolean
    action?: boolean
    notes?: boolean
    changes?: boolean
    createdAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workflowAction"]>

  export type WorkflowActionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    userId?: boolean
    fromStage?: boolean
    toStage?: boolean
    action?: boolean
    notes?: boolean
    changes?: boolean
    createdAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workflowAction"]>

  export type WorkflowActionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    itemId?: boolean
    userId?: boolean
    fromStage?: boolean
    toStage?: boolean
    action?: boolean
    notes?: boolean
    changes?: boolean
    createdAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workflowAction"]>

  export type WorkflowActionSelectScalar = {
    id?: boolean
    itemId?: boolean
    userId?: boolean
    fromStage?: boolean
    toStage?: boolean
    action?: boolean
    notes?: boolean
    changes?: boolean
    createdAt?: boolean
  }

  export type WorkflowActionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "itemId" | "userId" | "fromStage" | "toStage" | "action" | "notes" | "changes" | "createdAt", ExtArgs["result"]["workflowAction"]>
  export type WorkflowActionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type WorkflowActionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type WorkflowActionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $WorkflowActionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkflowAction"
    objects: {
      item: Prisma.$ItemPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      itemId: string
      userId: string
      fromStage: $Enums.WorkflowStage
      toStage: $Enums.WorkflowStage
      action: string
      notes: string | null
      changes: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["workflowAction"]>
    composites: {}
  }

  type WorkflowActionGetPayload<S extends boolean | null | undefined | WorkflowActionDefaultArgs> = $Result.GetResult<Prisma.$WorkflowActionPayload, S>

  type WorkflowActionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorkflowActionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorkflowActionCountAggregateInputType | true
    }

  export interface WorkflowActionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkflowAction'], meta: { name: 'WorkflowAction' } }
    /**
     * Find zero or one WorkflowAction that matches the filter.
     * @param {WorkflowActionFindUniqueArgs} args - Arguments to find a WorkflowAction
     * @example
     * // Get one WorkflowAction
     * const workflowAction = await prisma.workflowAction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkflowActionFindUniqueArgs>(args: SelectSubset<T, WorkflowActionFindUniqueArgs<ExtArgs>>): Prisma__WorkflowActionClient<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorkflowAction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkflowActionFindUniqueOrThrowArgs} args - Arguments to find a WorkflowAction
     * @example
     * // Get one WorkflowAction
     * const workflowAction = await prisma.workflowAction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkflowActionFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkflowActionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkflowActionClient<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkflowAction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkflowActionFindFirstArgs} args - Arguments to find a WorkflowAction
     * @example
     * // Get one WorkflowAction
     * const workflowAction = await prisma.workflowAction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkflowActionFindFirstArgs>(args?: SelectSubset<T, WorkflowActionFindFirstArgs<ExtArgs>>): Prisma__WorkflowActionClient<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkflowAction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkflowActionFindFirstOrThrowArgs} args - Arguments to find a WorkflowAction
     * @example
     * // Get one WorkflowAction
     * const workflowAction = await prisma.workflowAction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkflowActionFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkflowActionFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkflowActionClient<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorkflowActions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkflowActionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkflowActions
     * const workflowActions = await prisma.workflowAction.findMany()
     * 
     * // Get first 10 WorkflowActions
     * const workflowActions = await prisma.workflowAction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workflowActionWithIdOnly = await prisma.workflowAction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkflowActionFindManyArgs>(args?: SelectSubset<T, WorkflowActionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorkflowAction.
     * @param {WorkflowActionCreateArgs} args - Arguments to create a WorkflowAction.
     * @example
     * // Create one WorkflowAction
     * const WorkflowAction = await prisma.workflowAction.create({
     *   data: {
     *     // ... data to create a WorkflowAction
     *   }
     * })
     * 
     */
    create<T extends WorkflowActionCreateArgs>(args: SelectSubset<T, WorkflowActionCreateArgs<ExtArgs>>): Prisma__WorkflowActionClient<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorkflowActions.
     * @param {WorkflowActionCreateManyArgs} args - Arguments to create many WorkflowActions.
     * @example
     * // Create many WorkflowActions
     * const workflowAction = await prisma.workflowAction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkflowActionCreateManyArgs>(args?: SelectSubset<T, WorkflowActionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkflowActions and returns the data saved in the database.
     * @param {WorkflowActionCreateManyAndReturnArgs} args - Arguments to create many WorkflowActions.
     * @example
     * // Create many WorkflowActions
     * const workflowAction = await prisma.workflowAction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkflowActions and only return the `id`
     * const workflowActionWithIdOnly = await prisma.workflowAction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkflowActionCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkflowActionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorkflowAction.
     * @param {WorkflowActionDeleteArgs} args - Arguments to delete one WorkflowAction.
     * @example
     * // Delete one WorkflowAction
     * const WorkflowAction = await prisma.workflowAction.delete({
     *   where: {
     *     // ... filter to delete one WorkflowAction
     *   }
     * })
     * 
     */
    delete<T extends WorkflowActionDeleteArgs>(args: SelectSubset<T, WorkflowActionDeleteArgs<ExtArgs>>): Prisma__WorkflowActionClient<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorkflowAction.
     * @param {WorkflowActionUpdateArgs} args - Arguments to update one WorkflowAction.
     * @example
     * // Update one WorkflowAction
     * const workflowAction = await prisma.workflowAction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkflowActionUpdateArgs>(args: SelectSubset<T, WorkflowActionUpdateArgs<ExtArgs>>): Prisma__WorkflowActionClient<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorkflowActions.
     * @param {WorkflowActionDeleteManyArgs} args - Arguments to filter WorkflowActions to delete.
     * @example
     * // Delete a few WorkflowActions
     * const { count } = await prisma.workflowAction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkflowActionDeleteManyArgs>(args?: SelectSubset<T, WorkflowActionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkflowActions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkflowActionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkflowActions
     * const workflowAction = await prisma.workflowAction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkflowActionUpdateManyArgs>(args: SelectSubset<T, WorkflowActionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkflowActions and returns the data updated in the database.
     * @param {WorkflowActionUpdateManyAndReturnArgs} args - Arguments to update many WorkflowActions.
     * @example
     * // Update many WorkflowActions
     * const workflowAction = await prisma.workflowAction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorkflowActions and only return the `id`
     * const workflowActionWithIdOnly = await prisma.workflowAction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorkflowActionUpdateManyAndReturnArgs>(args: SelectSubset<T, WorkflowActionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorkflowAction.
     * @param {WorkflowActionUpsertArgs} args - Arguments to update or create a WorkflowAction.
     * @example
     * // Update or create a WorkflowAction
     * const workflowAction = await prisma.workflowAction.upsert({
     *   create: {
     *     // ... data to create a WorkflowAction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkflowAction we want to update
     *   }
     * })
     */
    upsert<T extends WorkflowActionUpsertArgs>(args: SelectSubset<T, WorkflowActionUpsertArgs<ExtArgs>>): Prisma__WorkflowActionClient<$Result.GetResult<Prisma.$WorkflowActionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorkflowActions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkflowActionCountArgs} args - Arguments to filter WorkflowActions to count.
     * @example
     * // Count the number of WorkflowActions
     * const count = await prisma.workflowAction.count({
     *   where: {
     *     // ... the filter for the WorkflowActions we want to count
     *   }
     * })
    **/
    count<T extends WorkflowActionCountArgs>(
      args?: Subset<T, WorkflowActionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkflowActionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkflowAction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkflowActionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkflowActionAggregateArgs>(args: Subset<T, WorkflowActionAggregateArgs>): Prisma.PrismaPromise<GetWorkflowActionAggregateType<T>>

    /**
     * Group by WorkflowAction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkflowActionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkflowActionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkflowActionGroupByArgs['orderBy'] }
        : { orderBy?: WorkflowActionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkflowActionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkflowActionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkflowAction model
   */
  readonly fields: WorkflowActionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkflowAction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkflowActionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    item<T extends ItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ItemDefaultArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkflowAction model
   */
  interface WorkflowActionFieldRefs {
    readonly id: FieldRef<"WorkflowAction", 'String'>
    readonly itemId: FieldRef<"WorkflowAction", 'String'>
    readonly userId: FieldRef<"WorkflowAction", 'String'>
    readonly fromStage: FieldRef<"WorkflowAction", 'WorkflowStage'>
    readonly toStage: FieldRef<"WorkflowAction", 'WorkflowStage'>
    readonly action: FieldRef<"WorkflowAction", 'String'>
    readonly notes: FieldRef<"WorkflowAction", 'String'>
    readonly changes: FieldRef<"WorkflowAction", 'Json'>
    readonly createdAt: FieldRef<"WorkflowAction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkflowAction findUnique
   */
  export type WorkflowActionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * Filter, which WorkflowAction to fetch.
     */
    where: WorkflowActionWhereUniqueInput
  }

  /**
   * WorkflowAction findUniqueOrThrow
   */
  export type WorkflowActionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * Filter, which WorkflowAction to fetch.
     */
    where: WorkflowActionWhereUniqueInput
  }

  /**
   * WorkflowAction findFirst
   */
  export type WorkflowActionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * Filter, which WorkflowAction to fetch.
     */
    where?: WorkflowActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkflowActions to fetch.
     */
    orderBy?: WorkflowActionOrderByWithRelationInput | WorkflowActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkflowActions.
     */
    cursor?: WorkflowActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkflowActions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkflowActions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkflowActions.
     */
    distinct?: WorkflowActionScalarFieldEnum | WorkflowActionScalarFieldEnum[]
  }

  /**
   * WorkflowAction findFirstOrThrow
   */
  export type WorkflowActionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * Filter, which WorkflowAction to fetch.
     */
    where?: WorkflowActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkflowActions to fetch.
     */
    orderBy?: WorkflowActionOrderByWithRelationInput | WorkflowActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkflowActions.
     */
    cursor?: WorkflowActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkflowActions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkflowActions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkflowActions.
     */
    distinct?: WorkflowActionScalarFieldEnum | WorkflowActionScalarFieldEnum[]
  }

  /**
   * WorkflowAction findMany
   */
  export type WorkflowActionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * Filter, which WorkflowActions to fetch.
     */
    where?: WorkflowActionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkflowActions to fetch.
     */
    orderBy?: WorkflowActionOrderByWithRelationInput | WorkflowActionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkflowActions.
     */
    cursor?: WorkflowActionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkflowActions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkflowActions.
     */
    skip?: number
    distinct?: WorkflowActionScalarFieldEnum | WorkflowActionScalarFieldEnum[]
  }

  /**
   * WorkflowAction create
   */
  export type WorkflowActionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkflowAction.
     */
    data: XOR<WorkflowActionCreateInput, WorkflowActionUncheckedCreateInput>
  }

  /**
   * WorkflowAction createMany
   */
  export type WorkflowActionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkflowActions.
     */
    data: WorkflowActionCreateManyInput | WorkflowActionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkflowAction createManyAndReturn
   */
  export type WorkflowActionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * The data used to create many WorkflowActions.
     */
    data: WorkflowActionCreateManyInput | WorkflowActionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkflowAction update
   */
  export type WorkflowActionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkflowAction.
     */
    data: XOR<WorkflowActionUpdateInput, WorkflowActionUncheckedUpdateInput>
    /**
     * Choose, which WorkflowAction to update.
     */
    where: WorkflowActionWhereUniqueInput
  }

  /**
   * WorkflowAction updateMany
   */
  export type WorkflowActionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkflowActions.
     */
    data: XOR<WorkflowActionUpdateManyMutationInput, WorkflowActionUncheckedUpdateManyInput>
    /**
     * Filter which WorkflowActions to update
     */
    where?: WorkflowActionWhereInput
    /**
     * Limit how many WorkflowActions to update.
     */
    limit?: number
  }

  /**
   * WorkflowAction updateManyAndReturn
   */
  export type WorkflowActionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * The data used to update WorkflowActions.
     */
    data: XOR<WorkflowActionUpdateManyMutationInput, WorkflowActionUncheckedUpdateManyInput>
    /**
     * Filter which WorkflowActions to update
     */
    where?: WorkflowActionWhereInput
    /**
     * Limit how many WorkflowActions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkflowAction upsert
   */
  export type WorkflowActionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkflowAction to update in case it exists.
     */
    where: WorkflowActionWhereUniqueInput
    /**
     * In case the WorkflowAction found by the `where` argument doesn't exist, create a new WorkflowAction with this data.
     */
    create: XOR<WorkflowActionCreateInput, WorkflowActionUncheckedCreateInput>
    /**
     * In case the WorkflowAction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkflowActionUpdateInput, WorkflowActionUncheckedUpdateInput>
  }

  /**
   * WorkflowAction delete
   */
  export type WorkflowActionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
    /**
     * Filter which WorkflowAction to delete.
     */
    where: WorkflowActionWhereUniqueInput
  }

  /**
   * WorkflowAction deleteMany
   */
  export type WorkflowActionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkflowActions to delete
     */
    where?: WorkflowActionWhereInput
    /**
     * Limit how many WorkflowActions to delete.
     */
    limit?: number
  }

  /**
   * WorkflowAction without action
   */
  export type WorkflowActionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkflowAction
     */
    select?: WorkflowActionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkflowAction
     */
    omit?: WorkflowActionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkflowActionInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const LocationScalarFieldEnum: {
    id: 'id',
    name: 'name',
    code: 'code',
    address: 'address',
    timezone: 'timezone',
    isActive: 'isActive',
    serverUrl: 'serverUrl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LocationScalarFieldEnum = (typeof LocationScalarFieldEnum)[keyof typeof LocationScalarFieldEnum]


  export const EbayAccountScalarFieldEnum: {
    id: 'id',
    accountName: 'accountName',
    email: 'email',
    appId: 'appId',
    certId: 'certId',
    devId: 'devId',
    authToken: 'authToken',
    refreshToken: 'refreshToken',
    sandbox: 'sandbox',
    siteId: 'siteId',
    paypalEmail: 'paypalEmail',
    postalCode: 'postalCode',
    isActive: 'isActive',
    lastSync: 'lastSync',
    locationId: 'locationId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EbayAccountScalarFieldEnum = (typeof EbayAccountScalarFieldEnum)[keyof typeof EbayAccountScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    role: 'role',
    password: 'password',
    locationId: 'locationId',
    lastActive: 'lastActive',
    isOnline: 'isOnline',
    currentItemId: 'currentItemId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ItemScalarFieldEnum: {
    id: 'id',
    sku: 'sku',
    stage: 'stage',
    status: 'status',
    locationId: 'locationId',
    ebayAccountId: 'ebayAccountId',
    createdById: 'createdById',
    title: 'title',
    description: 'description',
    category: 'category',
    condition: 'condition',
    brand: 'brand',
    features: 'features',
    keywords: 'keywords',
    aiAnalysis: 'aiAnalysis',
    startingPrice: 'startingPrice',
    buyNowPrice: 'buyNowPrice',
    shippingCost: 'shippingCost',
    ebayId: 'ebayId',
    publishedAt: 'publishedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ItemScalarFieldEnum = (typeof ItemScalarFieldEnum)[keyof typeof ItemScalarFieldEnum]


  export const UserSessionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type UserSessionScalarFieldEnum = (typeof UserSessionScalarFieldEnum)[keyof typeof UserSessionScalarFieldEnum]


  export const PhotoScalarFieldEnum: {
    id: 'id',
    itemId: 'itemId',
    originalPath: 'originalPath',
    thumbnailPath: 'thumbnailPath',
    optimizedPath: 'optimizedPath',
    isPrimary: 'isPrimary',
    order: 'order',
    analysis: 'analysis',
    processedAt: 'processedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PhotoScalarFieldEnum = (typeof PhotoScalarFieldEnum)[keyof typeof PhotoScalarFieldEnum]


  export const WorkflowActionScalarFieldEnum: {
    id: 'id',
    itemId: 'itemId',
    userId: 'userId',
    fromStage: 'fromStage',
    toStage: 'toStage',
    action: 'action',
    notes: 'notes',
    changes: 'changes',
    createdAt: 'createdAt'
  };

  export type WorkflowActionScalarFieldEnum = (typeof WorkflowActionScalarFieldEnum)[keyof typeof WorkflowActionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    


  /**
   * Reference to a field of type 'WorkflowStage'
   */
  export type EnumWorkflowStageFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkflowStage'>
    


  /**
   * Reference to a field of type 'WorkflowStage[]'
   */
  export type ListEnumWorkflowStageFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WorkflowStage[]'>
    


  /**
   * Reference to a field of type 'ItemStatus'
   */
  export type EnumItemStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemStatus'>
    


  /**
   * Reference to a field of type 'ItemStatus[]'
   */
  export type ListEnumItemStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type LocationWhereInput = {
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    id?: StringFilter<"Location"> | string
    name?: StringFilter<"Location"> | string
    code?: StringFilter<"Location"> | string
    address?: StringNullableFilter<"Location"> | string | null
    timezone?: StringFilter<"Location"> | string
    isActive?: BoolFilter<"Location"> | boolean
    serverUrl?: StringNullableFilter<"Location"> | string | null
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
    users?: UserListRelationFilter
    items?: ItemListRelationFilter
    ebayAccounts?: EbayAccountListRelationFilter
  }

  export type LocationOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    address?: SortOrderInput | SortOrder
    timezone?: SortOrder
    isActive?: SortOrder
    serverUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    users?: UserOrderByRelationAggregateInput
    items?: ItemOrderByRelationAggregateInput
    ebayAccounts?: EbayAccountOrderByRelationAggregateInput
  }

  export type LocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    code?: string
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    address?: StringNullableFilter<"Location"> | string | null
    timezone?: StringFilter<"Location"> | string
    isActive?: BoolFilter<"Location"> | boolean
    serverUrl?: StringNullableFilter<"Location"> | string | null
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
    users?: UserListRelationFilter
    items?: ItemListRelationFilter
    ebayAccounts?: EbayAccountListRelationFilter
  }, "id" | "name" | "code">

  export type LocationOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    address?: SortOrderInput | SortOrder
    timezone?: SortOrder
    isActive?: SortOrder
    serverUrl?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LocationCountOrderByAggregateInput
    _max?: LocationMaxOrderByAggregateInput
    _min?: LocationMinOrderByAggregateInput
  }

  export type LocationScalarWhereWithAggregatesInput = {
    AND?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    OR?: LocationScalarWhereWithAggregatesInput[]
    NOT?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Location"> | string
    name?: StringWithAggregatesFilter<"Location"> | string
    code?: StringWithAggregatesFilter<"Location"> | string
    address?: StringNullableWithAggregatesFilter<"Location"> | string | null
    timezone?: StringWithAggregatesFilter<"Location"> | string
    isActive?: BoolWithAggregatesFilter<"Location"> | boolean
    serverUrl?: StringNullableWithAggregatesFilter<"Location"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Location"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Location"> | Date | string
  }

  export type EbayAccountWhereInput = {
    AND?: EbayAccountWhereInput | EbayAccountWhereInput[]
    OR?: EbayAccountWhereInput[]
    NOT?: EbayAccountWhereInput | EbayAccountWhereInput[]
    id?: StringFilter<"EbayAccount"> | string
    accountName?: StringFilter<"EbayAccount"> | string
    email?: StringFilter<"EbayAccount"> | string
    appId?: StringFilter<"EbayAccount"> | string
    certId?: StringFilter<"EbayAccount"> | string
    devId?: StringFilter<"EbayAccount"> | string
    authToken?: StringNullableFilter<"EbayAccount"> | string | null
    refreshToken?: StringNullableFilter<"EbayAccount"> | string | null
    sandbox?: BoolFilter<"EbayAccount"> | boolean
    siteId?: IntFilter<"EbayAccount"> | number
    paypalEmail?: StringNullableFilter<"EbayAccount"> | string | null
    postalCode?: StringNullableFilter<"EbayAccount"> | string | null
    isActive?: BoolFilter<"EbayAccount"> | boolean
    lastSync?: DateTimeNullableFilter<"EbayAccount"> | Date | string | null
    locationId?: StringFilter<"EbayAccount"> | string
    createdAt?: DateTimeFilter<"EbayAccount"> | Date | string
    updatedAt?: DateTimeFilter<"EbayAccount"> | Date | string
    location?: XOR<LocationScalarRelationFilter, LocationWhereInput>
    items?: ItemListRelationFilter
  }

  export type EbayAccountOrderByWithRelationInput = {
    id?: SortOrder
    accountName?: SortOrder
    email?: SortOrder
    appId?: SortOrder
    certId?: SortOrder
    devId?: SortOrder
    authToken?: SortOrderInput | SortOrder
    refreshToken?: SortOrderInput | SortOrder
    sandbox?: SortOrder
    siteId?: SortOrder
    paypalEmail?: SortOrderInput | SortOrder
    postalCode?: SortOrderInput | SortOrder
    isActive?: SortOrder
    lastSync?: SortOrderInput | SortOrder
    locationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    location?: LocationOrderByWithRelationInput
    items?: ItemOrderByRelationAggregateInput
  }

  export type EbayAccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    accountName?: string
    AND?: EbayAccountWhereInput | EbayAccountWhereInput[]
    OR?: EbayAccountWhereInput[]
    NOT?: EbayAccountWhereInput | EbayAccountWhereInput[]
    email?: StringFilter<"EbayAccount"> | string
    appId?: StringFilter<"EbayAccount"> | string
    certId?: StringFilter<"EbayAccount"> | string
    devId?: StringFilter<"EbayAccount"> | string
    authToken?: StringNullableFilter<"EbayAccount"> | string | null
    refreshToken?: StringNullableFilter<"EbayAccount"> | string | null
    sandbox?: BoolFilter<"EbayAccount"> | boolean
    siteId?: IntFilter<"EbayAccount"> | number
    paypalEmail?: StringNullableFilter<"EbayAccount"> | string | null
    postalCode?: StringNullableFilter<"EbayAccount"> | string | null
    isActive?: BoolFilter<"EbayAccount"> | boolean
    lastSync?: DateTimeNullableFilter<"EbayAccount"> | Date | string | null
    locationId?: StringFilter<"EbayAccount"> | string
    createdAt?: DateTimeFilter<"EbayAccount"> | Date | string
    updatedAt?: DateTimeFilter<"EbayAccount"> | Date | string
    location?: XOR<LocationScalarRelationFilter, LocationWhereInput>
    items?: ItemListRelationFilter
  }, "id" | "accountName">

  export type EbayAccountOrderByWithAggregationInput = {
    id?: SortOrder
    accountName?: SortOrder
    email?: SortOrder
    appId?: SortOrder
    certId?: SortOrder
    devId?: SortOrder
    authToken?: SortOrderInput | SortOrder
    refreshToken?: SortOrderInput | SortOrder
    sandbox?: SortOrder
    siteId?: SortOrder
    paypalEmail?: SortOrderInput | SortOrder
    postalCode?: SortOrderInput | SortOrder
    isActive?: SortOrder
    lastSync?: SortOrderInput | SortOrder
    locationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EbayAccountCountOrderByAggregateInput
    _avg?: EbayAccountAvgOrderByAggregateInput
    _max?: EbayAccountMaxOrderByAggregateInput
    _min?: EbayAccountMinOrderByAggregateInput
    _sum?: EbayAccountSumOrderByAggregateInput
  }

  export type EbayAccountScalarWhereWithAggregatesInput = {
    AND?: EbayAccountScalarWhereWithAggregatesInput | EbayAccountScalarWhereWithAggregatesInput[]
    OR?: EbayAccountScalarWhereWithAggregatesInput[]
    NOT?: EbayAccountScalarWhereWithAggregatesInput | EbayAccountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EbayAccount"> | string
    accountName?: StringWithAggregatesFilter<"EbayAccount"> | string
    email?: StringWithAggregatesFilter<"EbayAccount"> | string
    appId?: StringWithAggregatesFilter<"EbayAccount"> | string
    certId?: StringWithAggregatesFilter<"EbayAccount"> | string
    devId?: StringWithAggregatesFilter<"EbayAccount"> | string
    authToken?: StringNullableWithAggregatesFilter<"EbayAccount"> | string | null
    refreshToken?: StringNullableWithAggregatesFilter<"EbayAccount"> | string | null
    sandbox?: BoolWithAggregatesFilter<"EbayAccount"> | boolean
    siteId?: IntWithAggregatesFilter<"EbayAccount"> | number
    paypalEmail?: StringNullableWithAggregatesFilter<"EbayAccount"> | string | null
    postalCode?: StringNullableWithAggregatesFilter<"EbayAccount"> | string | null
    isActive?: BoolWithAggregatesFilter<"EbayAccount"> | boolean
    lastSync?: DateTimeNullableWithAggregatesFilter<"EbayAccount"> | Date | string | null
    locationId?: StringWithAggregatesFilter<"EbayAccount"> | string
    createdAt?: DateTimeWithAggregatesFilter<"EbayAccount"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"EbayAccount"> | Date | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    password?: StringFilter<"User"> | string
    locationId?: StringNullableFilter<"User"> | string | null
    lastActive?: DateTimeNullableFilter<"User"> | Date | string | null
    isOnline?: BoolFilter<"User"> | boolean
    currentItemId?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    location?: XOR<LocationNullableScalarRelationFilter, LocationWhereInput> | null
    itemsCreated?: ItemListRelationFilter
    workflowActions?: WorkflowActionListRelationFilter
    sessions?: UserSessionListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
    locationId?: SortOrderInput | SortOrder
    lastActive?: SortOrderInput | SortOrder
    isOnline?: SortOrder
    currentItemId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    location?: LocationOrderByWithRelationInput
    itemsCreated?: ItemOrderByRelationAggregateInput
    workflowActions?: WorkflowActionOrderByRelationAggregateInput
    sessions?: UserSessionOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    password?: StringFilter<"User"> | string
    locationId?: StringNullableFilter<"User"> | string | null
    lastActive?: DateTimeNullableFilter<"User"> | Date | string | null
    isOnline?: BoolFilter<"User"> | boolean
    currentItemId?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    location?: XOR<LocationNullableScalarRelationFilter, LocationWhereInput> | null
    itemsCreated?: ItemListRelationFilter
    workflowActions?: WorkflowActionListRelationFilter
    sessions?: UserSessionListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
    locationId?: SortOrderInput | SortOrder
    lastActive?: SortOrderInput | SortOrder
    isOnline?: SortOrder
    currentItemId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    role?: EnumUserRoleWithAggregatesFilter<"User"> | $Enums.UserRole
    password?: StringWithAggregatesFilter<"User"> | string
    locationId?: StringNullableWithAggregatesFilter<"User"> | string | null
    lastActive?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    isOnline?: BoolWithAggregatesFilter<"User"> | boolean
    currentItemId?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type ItemWhereInput = {
    AND?: ItemWhereInput | ItemWhereInput[]
    OR?: ItemWhereInput[]
    NOT?: ItemWhereInput | ItemWhereInput[]
    id?: StringFilter<"Item"> | string
    sku?: StringNullableFilter<"Item"> | string | null
    stage?: EnumWorkflowStageFilter<"Item"> | $Enums.WorkflowStage
    status?: EnumItemStatusFilter<"Item"> | $Enums.ItemStatus
    locationId?: StringFilter<"Item"> | string
    ebayAccountId?: StringNullableFilter<"Item"> | string | null
    createdById?: StringFilter<"Item"> | string
    title?: StringNullableFilter<"Item"> | string | null
    description?: StringNullableFilter<"Item"> | string | null
    category?: StringNullableFilter<"Item"> | string | null
    condition?: StringNullableFilter<"Item"> | string | null
    brand?: StringNullableFilter<"Item"> | string | null
    features?: StringNullableListFilter<"Item">
    keywords?: StringNullableListFilter<"Item">
    aiAnalysis?: JsonNullableFilter<"Item">
    startingPrice?: FloatNullableFilter<"Item"> | number | null
    buyNowPrice?: FloatNullableFilter<"Item"> | number | null
    shippingCost?: FloatNullableFilter<"Item"> | number | null
    ebayId?: StringNullableFilter<"Item"> | string | null
    publishedAt?: DateTimeNullableFilter<"Item"> | Date | string | null
    createdAt?: DateTimeFilter<"Item"> | Date | string
    updatedAt?: DateTimeFilter<"Item"> | Date | string
    location?: XOR<LocationScalarRelationFilter, LocationWhereInput>
    ebayAccount?: XOR<EbayAccountNullableScalarRelationFilter, EbayAccountWhereInput> | null
    createdBy?: XOR<UserScalarRelationFilter, UserWhereInput>
    photos?: PhotoListRelationFilter
    workflowActions?: WorkflowActionListRelationFilter
  }

  export type ItemOrderByWithRelationInput = {
    id?: SortOrder
    sku?: SortOrderInput | SortOrder
    stage?: SortOrder
    status?: SortOrder
    locationId?: SortOrder
    ebayAccountId?: SortOrderInput | SortOrder
    createdById?: SortOrder
    title?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    category?: SortOrderInput | SortOrder
    condition?: SortOrderInput | SortOrder
    brand?: SortOrderInput | SortOrder
    features?: SortOrder
    keywords?: SortOrder
    aiAnalysis?: SortOrderInput | SortOrder
    startingPrice?: SortOrderInput | SortOrder
    buyNowPrice?: SortOrderInput | SortOrder
    shippingCost?: SortOrderInput | SortOrder
    ebayId?: SortOrderInput | SortOrder
    publishedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    location?: LocationOrderByWithRelationInput
    ebayAccount?: EbayAccountOrderByWithRelationInput
    createdBy?: UserOrderByWithRelationInput
    photos?: PhotoOrderByRelationAggregateInput
    workflowActions?: WorkflowActionOrderByRelationAggregateInput
  }

  export type ItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sku?: string
    ebayId?: string
    AND?: ItemWhereInput | ItemWhereInput[]
    OR?: ItemWhereInput[]
    NOT?: ItemWhereInput | ItemWhereInput[]
    stage?: EnumWorkflowStageFilter<"Item"> | $Enums.WorkflowStage
    status?: EnumItemStatusFilter<"Item"> | $Enums.ItemStatus
    locationId?: StringFilter<"Item"> | string
    ebayAccountId?: StringNullableFilter<"Item"> | string | null
    createdById?: StringFilter<"Item"> | string
    title?: StringNullableFilter<"Item"> | string | null
    description?: StringNullableFilter<"Item"> | string | null
    category?: StringNullableFilter<"Item"> | string | null
    condition?: StringNullableFilter<"Item"> | string | null
    brand?: StringNullableFilter<"Item"> | string | null
    features?: StringNullableListFilter<"Item">
    keywords?: StringNullableListFilter<"Item">
    aiAnalysis?: JsonNullableFilter<"Item">
    startingPrice?: FloatNullableFilter<"Item"> | number | null
    buyNowPrice?: FloatNullableFilter<"Item"> | number | null
    shippingCost?: FloatNullableFilter<"Item"> | number | null
    publishedAt?: DateTimeNullableFilter<"Item"> | Date | string | null
    createdAt?: DateTimeFilter<"Item"> | Date | string
    updatedAt?: DateTimeFilter<"Item"> | Date | string
    location?: XOR<LocationScalarRelationFilter, LocationWhereInput>
    ebayAccount?: XOR<EbayAccountNullableScalarRelationFilter, EbayAccountWhereInput> | null
    createdBy?: XOR<UserScalarRelationFilter, UserWhereInput>
    photos?: PhotoListRelationFilter
    workflowActions?: WorkflowActionListRelationFilter
  }, "id" | "sku" | "ebayId">

  export type ItemOrderByWithAggregationInput = {
    id?: SortOrder
    sku?: SortOrderInput | SortOrder
    stage?: SortOrder
    status?: SortOrder
    locationId?: SortOrder
    ebayAccountId?: SortOrderInput | SortOrder
    createdById?: SortOrder
    title?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    category?: SortOrderInput | SortOrder
    condition?: SortOrderInput | SortOrder
    brand?: SortOrderInput | SortOrder
    features?: SortOrder
    keywords?: SortOrder
    aiAnalysis?: SortOrderInput | SortOrder
    startingPrice?: SortOrderInput | SortOrder
    buyNowPrice?: SortOrderInput | SortOrder
    shippingCost?: SortOrderInput | SortOrder
    ebayId?: SortOrderInput | SortOrder
    publishedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ItemCountOrderByAggregateInput
    _avg?: ItemAvgOrderByAggregateInput
    _max?: ItemMaxOrderByAggregateInput
    _min?: ItemMinOrderByAggregateInput
    _sum?: ItemSumOrderByAggregateInput
  }

  export type ItemScalarWhereWithAggregatesInput = {
    AND?: ItemScalarWhereWithAggregatesInput | ItemScalarWhereWithAggregatesInput[]
    OR?: ItemScalarWhereWithAggregatesInput[]
    NOT?: ItemScalarWhereWithAggregatesInput | ItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Item"> | string
    sku?: StringNullableWithAggregatesFilter<"Item"> | string | null
    stage?: EnumWorkflowStageWithAggregatesFilter<"Item"> | $Enums.WorkflowStage
    status?: EnumItemStatusWithAggregatesFilter<"Item"> | $Enums.ItemStatus
    locationId?: StringWithAggregatesFilter<"Item"> | string
    ebayAccountId?: StringNullableWithAggregatesFilter<"Item"> | string | null
    createdById?: StringWithAggregatesFilter<"Item"> | string
    title?: StringNullableWithAggregatesFilter<"Item"> | string | null
    description?: StringNullableWithAggregatesFilter<"Item"> | string | null
    category?: StringNullableWithAggregatesFilter<"Item"> | string | null
    condition?: StringNullableWithAggregatesFilter<"Item"> | string | null
    brand?: StringNullableWithAggregatesFilter<"Item"> | string | null
    features?: StringNullableListFilter<"Item">
    keywords?: StringNullableListFilter<"Item">
    aiAnalysis?: JsonNullableWithAggregatesFilter<"Item">
    startingPrice?: FloatNullableWithAggregatesFilter<"Item"> | number | null
    buyNowPrice?: FloatNullableWithAggregatesFilter<"Item"> | number | null
    shippingCost?: FloatNullableWithAggregatesFilter<"Item"> | number | null
    ebayId?: StringNullableWithAggregatesFilter<"Item"> | string | null
    publishedAt?: DateTimeNullableWithAggregatesFilter<"Item"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Item"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Item"> | Date | string
  }

  export type UserSessionWhereInput = {
    AND?: UserSessionWhereInput | UserSessionWhereInput[]
    OR?: UserSessionWhereInput[]
    NOT?: UserSessionWhereInput | UserSessionWhereInput[]
    id?: StringFilter<"UserSession"> | string
    userId?: StringFilter<"UserSession"> | string
    token?: StringFilter<"UserSession"> | string
    expiresAt?: DateTimeFilter<"UserSession"> | Date | string
    createdAt?: DateTimeFilter<"UserSession"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type UserSessionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type UserSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: UserSessionWhereInput | UserSessionWhereInput[]
    OR?: UserSessionWhereInput[]
    NOT?: UserSessionWhereInput | UserSessionWhereInput[]
    userId?: StringFilter<"UserSession"> | string
    expiresAt?: DateTimeFilter<"UserSession"> | Date | string
    createdAt?: DateTimeFilter<"UserSession"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type UserSessionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: UserSessionCountOrderByAggregateInput
    _max?: UserSessionMaxOrderByAggregateInput
    _min?: UserSessionMinOrderByAggregateInput
  }

  export type UserSessionScalarWhereWithAggregatesInput = {
    AND?: UserSessionScalarWhereWithAggregatesInput | UserSessionScalarWhereWithAggregatesInput[]
    OR?: UserSessionScalarWhereWithAggregatesInput[]
    NOT?: UserSessionScalarWhereWithAggregatesInput | UserSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UserSession"> | string
    userId?: StringWithAggregatesFilter<"UserSession"> | string
    token?: StringWithAggregatesFilter<"UserSession"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"UserSession"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"UserSession"> | Date | string
  }

  export type PhotoWhereInput = {
    AND?: PhotoWhereInput | PhotoWhereInput[]
    OR?: PhotoWhereInput[]
    NOT?: PhotoWhereInput | PhotoWhereInput[]
    id?: StringFilter<"Photo"> | string
    itemId?: StringFilter<"Photo"> | string
    originalPath?: StringFilter<"Photo"> | string
    thumbnailPath?: StringNullableFilter<"Photo"> | string | null
    optimizedPath?: StringNullableFilter<"Photo"> | string | null
    isPrimary?: BoolFilter<"Photo"> | boolean
    order?: IntFilter<"Photo"> | number
    analysis?: JsonNullableFilter<"Photo">
    processedAt?: DateTimeNullableFilter<"Photo"> | Date | string | null
    createdAt?: DateTimeFilter<"Photo"> | Date | string
    updatedAt?: DateTimeFilter<"Photo"> | Date | string
    item?: XOR<ItemScalarRelationFilter, ItemWhereInput>
  }

  export type PhotoOrderByWithRelationInput = {
    id?: SortOrder
    itemId?: SortOrder
    originalPath?: SortOrder
    thumbnailPath?: SortOrderInput | SortOrder
    optimizedPath?: SortOrderInput | SortOrder
    isPrimary?: SortOrder
    order?: SortOrder
    analysis?: SortOrderInput | SortOrder
    processedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    item?: ItemOrderByWithRelationInput
  }

  export type PhotoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PhotoWhereInput | PhotoWhereInput[]
    OR?: PhotoWhereInput[]
    NOT?: PhotoWhereInput | PhotoWhereInput[]
    itemId?: StringFilter<"Photo"> | string
    originalPath?: StringFilter<"Photo"> | string
    thumbnailPath?: StringNullableFilter<"Photo"> | string | null
    optimizedPath?: StringNullableFilter<"Photo"> | string | null
    isPrimary?: BoolFilter<"Photo"> | boolean
    order?: IntFilter<"Photo"> | number
    analysis?: JsonNullableFilter<"Photo">
    processedAt?: DateTimeNullableFilter<"Photo"> | Date | string | null
    createdAt?: DateTimeFilter<"Photo"> | Date | string
    updatedAt?: DateTimeFilter<"Photo"> | Date | string
    item?: XOR<ItemScalarRelationFilter, ItemWhereInput>
  }, "id">

  export type PhotoOrderByWithAggregationInput = {
    id?: SortOrder
    itemId?: SortOrder
    originalPath?: SortOrder
    thumbnailPath?: SortOrderInput | SortOrder
    optimizedPath?: SortOrderInput | SortOrder
    isPrimary?: SortOrder
    order?: SortOrder
    analysis?: SortOrderInput | SortOrder
    processedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PhotoCountOrderByAggregateInput
    _avg?: PhotoAvgOrderByAggregateInput
    _max?: PhotoMaxOrderByAggregateInput
    _min?: PhotoMinOrderByAggregateInput
    _sum?: PhotoSumOrderByAggregateInput
  }

  export type PhotoScalarWhereWithAggregatesInput = {
    AND?: PhotoScalarWhereWithAggregatesInput | PhotoScalarWhereWithAggregatesInput[]
    OR?: PhotoScalarWhereWithAggregatesInput[]
    NOT?: PhotoScalarWhereWithAggregatesInput | PhotoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Photo"> | string
    itemId?: StringWithAggregatesFilter<"Photo"> | string
    originalPath?: StringWithAggregatesFilter<"Photo"> | string
    thumbnailPath?: StringNullableWithAggregatesFilter<"Photo"> | string | null
    optimizedPath?: StringNullableWithAggregatesFilter<"Photo"> | string | null
    isPrimary?: BoolWithAggregatesFilter<"Photo"> | boolean
    order?: IntWithAggregatesFilter<"Photo"> | number
    analysis?: JsonNullableWithAggregatesFilter<"Photo">
    processedAt?: DateTimeNullableWithAggregatesFilter<"Photo"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Photo"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Photo"> | Date | string
  }

  export type WorkflowActionWhereInput = {
    AND?: WorkflowActionWhereInput | WorkflowActionWhereInput[]
    OR?: WorkflowActionWhereInput[]
    NOT?: WorkflowActionWhereInput | WorkflowActionWhereInput[]
    id?: StringFilter<"WorkflowAction"> | string
    itemId?: StringFilter<"WorkflowAction"> | string
    userId?: StringFilter<"WorkflowAction"> | string
    fromStage?: EnumWorkflowStageFilter<"WorkflowAction"> | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFilter<"WorkflowAction"> | $Enums.WorkflowStage
    action?: StringFilter<"WorkflowAction"> | string
    notes?: StringNullableFilter<"WorkflowAction"> | string | null
    changes?: JsonNullableFilter<"WorkflowAction">
    createdAt?: DateTimeFilter<"WorkflowAction"> | Date | string
    item?: XOR<ItemScalarRelationFilter, ItemWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type WorkflowActionOrderByWithRelationInput = {
    id?: SortOrder
    itemId?: SortOrder
    userId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    action?: SortOrder
    notes?: SortOrderInput | SortOrder
    changes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    item?: ItemOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type WorkflowActionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WorkflowActionWhereInput | WorkflowActionWhereInput[]
    OR?: WorkflowActionWhereInput[]
    NOT?: WorkflowActionWhereInput | WorkflowActionWhereInput[]
    itemId?: StringFilter<"WorkflowAction"> | string
    userId?: StringFilter<"WorkflowAction"> | string
    fromStage?: EnumWorkflowStageFilter<"WorkflowAction"> | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFilter<"WorkflowAction"> | $Enums.WorkflowStage
    action?: StringFilter<"WorkflowAction"> | string
    notes?: StringNullableFilter<"WorkflowAction"> | string | null
    changes?: JsonNullableFilter<"WorkflowAction">
    createdAt?: DateTimeFilter<"WorkflowAction"> | Date | string
    item?: XOR<ItemScalarRelationFilter, ItemWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type WorkflowActionOrderByWithAggregationInput = {
    id?: SortOrder
    itemId?: SortOrder
    userId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    action?: SortOrder
    notes?: SortOrderInput | SortOrder
    changes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: WorkflowActionCountOrderByAggregateInput
    _max?: WorkflowActionMaxOrderByAggregateInput
    _min?: WorkflowActionMinOrderByAggregateInput
  }

  export type WorkflowActionScalarWhereWithAggregatesInput = {
    AND?: WorkflowActionScalarWhereWithAggregatesInput | WorkflowActionScalarWhereWithAggregatesInput[]
    OR?: WorkflowActionScalarWhereWithAggregatesInput[]
    NOT?: WorkflowActionScalarWhereWithAggregatesInput | WorkflowActionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkflowAction"> | string
    itemId?: StringWithAggregatesFilter<"WorkflowAction"> | string
    userId?: StringWithAggregatesFilter<"WorkflowAction"> | string
    fromStage?: EnumWorkflowStageWithAggregatesFilter<"WorkflowAction"> | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageWithAggregatesFilter<"WorkflowAction"> | $Enums.WorkflowStage
    action?: StringWithAggregatesFilter<"WorkflowAction"> | string
    notes?: StringNullableWithAggregatesFilter<"WorkflowAction"> | string | null
    changes?: JsonNullableWithAggregatesFilter<"WorkflowAction">
    createdAt?: DateTimeWithAggregatesFilter<"WorkflowAction"> | Date | string
  }

  export type LocationCreateInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserCreateNestedManyWithoutLocationInput
    items?: ItemCreateNestedManyWithoutLocationInput
    ebayAccounts?: EbayAccountCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutLocationInput
    items?: ItemUncheckedCreateNestedManyWithoutLocationInput
    ebayAccounts?: EbayAccountUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutLocationNestedInput
    items?: ItemUpdateManyWithoutLocationNestedInput
    ebayAccounts?: EbayAccountUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutLocationNestedInput
    items?: ItemUncheckedUpdateManyWithoutLocationNestedInput
    ebayAccounts?: EbayAccountUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type LocationCreateManyInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EbayAccountCreateInput = {
    id?: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken?: string | null
    refreshToken?: string | null
    sandbox?: boolean
    siteId?: number
    paypalEmail?: string | null
    postalCode?: string | null
    isActive?: boolean
    lastSync?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location: LocationCreateNestedOneWithoutEbayAccountsInput
    items?: ItemCreateNestedManyWithoutEbayAccountInput
  }

  export type EbayAccountUncheckedCreateInput = {
    id?: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken?: string | null
    refreshToken?: string | null
    sandbox?: boolean
    siteId?: number
    paypalEmail?: string | null
    postalCode?: string | null
    isActive?: boolean
    lastSync?: Date | string | null
    locationId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: ItemUncheckedCreateNestedManyWithoutEbayAccountInput
  }

  export type EbayAccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneRequiredWithoutEbayAccountsNestedInput
    items?: ItemUpdateManyWithoutEbayAccountNestedInput
  }

  export type EbayAccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    locationId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ItemUncheckedUpdateManyWithoutEbayAccountNestedInput
  }

  export type EbayAccountCreateManyInput = {
    id?: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken?: string | null
    refreshToken?: string | null
    sandbox?: boolean
    siteId?: number
    paypalEmail?: string | null
    postalCode?: string | null
    isActive?: boolean
    lastSync?: Date | string | null
    locationId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EbayAccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EbayAccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    locationId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location?: LocationCreateNestedOneWithoutUsersInput
    itemsCreated?: ItemCreateNestedManyWithoutCreatedByInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutUserInput
    sessions?: UserSessionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    locationId?: string | null
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    itemsCreated?: ItemUncheckedCreateNestedManyWithoutCreatedByInput
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutUserInput
    sessions?: UserSessionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneWithoutUsersNestedInput
    itemsCreated?: ItemUpdateManyWithoutCreatedByNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutUserNestedInput
    sessions?: UserSessionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    itemsCreated?: ItemUncheckedUpdateManyWithoutCreatedByNestedInput
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutUserNestedInput
    sessions?: UserSessionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    locationId?: string | null
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCreateInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location: LocationCreateNestedOneWithoutItemsInput
    ebayAccount?: EbayAccountCreateNestedOneWithoutItemsInput
    createdBy: UserCreateNestedOneWithoutItemsCreatedInput
    photos?: PhotoCreateNestedManyWithoutItemInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    locationId: string
    ebayAccountId?: string | null
    createdById: string
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    photos?: PhotoUncheckedCreateNestedManyWithoutItemInput
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneRequiredWithoutItemsNestedInput
    ebayAccount?: EbayAccountUpdateOneWithoutItemsNestedInput
    createdBy?: UserUpdateOneRequiredWithoutItemsCreatedNestedInput
    photos?: PhotoUpdateManyWithoutItemNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    locationId?: StringFieldUpdateOperationsInput | string
    ebayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    photos?: PhotoUncheckedUpdateManyWithoutItemNestedInput
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemCreateManyInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    locationId: string
    ebayAccountId?: string | null
    createdById: string
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    locationId?: StringFieldUpdateOperationsInput | string
    ebayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSessionCreateInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type UserSessionUncheckedCreateInput = {
    id?: string
    userId: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type UserSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type UserSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSessionCreateManyInput = {
    id?: string
    userId: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type UserSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PhotoCreateInput = {
    id?: string
    originalPath: string
    thumbnailPath?: string | null
    optimizedPath?: string | null
    isPrimary?: boolean
    order?: number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    item: ItemCreateNestedOneWithoutPhotosInput
  }

  export type PhotoUncheckedCreateInput = {
    id?: string
    itemId: string
    originalPath: string
    thumbnailPath?: string | null
    optimizedPath?: string | null
    isPrimary?: boolean
    order?: number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PhotoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    originalPath?: StringFieldUpdateOperationsInput | string
    thumbnailPath?: NullableStringFieldUpdateOperationsInput | string | null
    optimizedPath?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    item?: ItemUpdateOneRequiredWithoutPhotosNestedInput
  }

  export type PhotoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    originalPath?: StringFieldUpdateOperationsInput | string
    thumbnailPath?: NullableStringFieldUpdateOperationsInput | string | null
    optimizedPath?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PhotoCreateManyInput = {
    id?: string
    itemId: string
    originalPath: string
    thumbnailPath?: string | null
    optimizedPath?: string | null
    isPrimary?: boolean
    order?: number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PhotoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    originalPath?: StringFieldUpdateOperationsInput | string
    thumbnailPath?: NullableStringFieldUpdateOperationsInput | string | null
    optimizedPath?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PhotoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    originalPath?: StringFieldUpdateOperationsInput | string
    thumbnailPath?: NullableStringFieldUpdateOperationsInput | string | null
    optimizedPath?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkflowActionCreateInput = {
    id?: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    item: ItemCreateNestedOneWithoutWorkflowActionsInput
    user: UserCreateNestedOneWithoutWorkflowActionsInput
  }

  export type WorkflowActionUncheckedCreateInput = {
    id?: string
    itemId: string
    userId: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type WorkflowActionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    item?: ItemUpdateOneRequiredWithoutWorkflowActionsNestedInput
    user?: UserUpdateOneRequiredWithoutWorkflowActionsNestedInput
  }

  export type WorkflowActionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkflowActionCreateManyInput = {
    id?: string
    itemId: string
    userId: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type WorkflowActionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkflowActionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type ItemListRelationFilter = {
    every?: ItemWhereInput
    some?: ItemWhereInput
    none?: ItemWhereInput
  }

  export type EbayAccountListRelationFilter = {
    every?: EbayAccountWhereInput
    some?: EbayAccountWhereInput
    none?: EbayAccountWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EbayAccountOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LocationCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    address?: SortOrder
    timezone?: SortOrder
    isActive?: SortOrder
    serverUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    address?: SortOrder
    timezone?: SortOrder
    isActive?: SortOrder
    serverUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    code?: SortOrder
    address?: SortOrder
    timezone?: SortOrder
    isActive?: SortOrder
    serverUrl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type LocationScalarRelationFilter = {
    is?: LocationWhereInput
    isNot?: LocationWhereInput
  }

  export type EbayAccountCountOrderByAggregateInput = {
    id?: SortOrder
    accountName?: SortOrder
    email?: SortOrder
    appId?: SortOrder
    certId?: SortOrder
    devId?: SortOrder
    authToken?: SortOrder
    refreshToken?: SortOrder
    sandbox?: SortOrder
    siteId?: SortOrder
    paypalEmail?: SortOrder
    postalCode?: SortOrder
    isActive?: SortOrder
    lastSync?: SortOrder
    locationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EbayAccountAvgOrderByAggregateInput = {
    siteId?: SortOrder
  }

  export type EbayAccountMaxOrderByAggregateInput = {
    id?: SortOrder
    accountName?: SortOrder
    email?: SortOrder
    appId?: SortOrder
    certId?: SortOrder
    devId?: SortOrder
    authToken?: SortOrder
    refreshToken?: SortOrder
    sandbox?: SortOrder
    siteId?: SortOrder
    paypalEmail?: SortOrder
    postalCode?: SortOrder
    isActive?: SortOrder
    lastSync?: SortOrder
    locationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EbayAccountMinOrderByAggregateInput = {
    id?: SortOrder
    accountName?: SortOrder
    email?: SortOrder
    appId?: SortOrder
    certId?: SortOrder
    devId?: SortOrder
    authToken?: SortOrder
    refreshToken?: SortOrder
    sandbox?: SortOrder
    siteId?: SortOrder
    paypalEmail?: SortOrder
    postalCode?: SortOrder
    isActive?: SortOrder
    lastSync?: SortOrder
    locationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EbayAccountSumOrderByAggregateInput = {
    siteId?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type LocationNullableScalarRelationFilter = {
    is?: LocationWhereInput | null
    isNot?: LocationWhereInput | null
  }

  export type WorkflowActionListRelationFilter = {
    every?: WorkflowActionWhereInput
    some?: WorkflowActionWhereInput
    none?: WorkflowActionWhereInput
  }

  export type UserSessionListRelationFilter = {
    every?: UserSessionWhereInput
    some?: UserSessionWhereInput
    none?: UserSessionWhereInput
  }

  export type WorkflowActionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserSessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
    locationId?: SortOrder
    lastActive?: SortOrder
    isOnline?: SortOrder
    currentItemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
    locationId?: SortOrder
    lastActive?: SortOrder
    isOnline?: SortOrder
    currentItemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    role?: SortOrder
    password?: SortOrder
    locationId?: SortOrder
    lastActive?: SortOrder
    isOnline?: SortOrder
    currentItemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type EnumWorkflowStageFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowStage | EnumWorkflowStageFieldRefInput<$PrismaModel>
    in?: $Enums.WorkflowStage[] | ListEnumWorkflowStageFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkflowStage[] | ListEnumWorkflowStageFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkflowStageFilter<$PrismaModel> | $Enums.WorkflowStage
  }

  export type EnumItemStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStatus | EnumItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStatusFilter<$PrismaModel> | $Enums.ItemStatus
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type EbayAccountNullableScalarRelationFilter = {
    is?: EbayAccountWhereInput | null
    isNot?: EbayAccountWhereInput | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type PhotoListRelationFilter = {
    every?: PhotoWhereInput
    some?: PhotoWhereInput
    none?: PhotoWhereInput
  }

  export type PhotoOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ItemCountOrderByAggregateInput = {
    id?: SortOrder
    sku?: SortOrder
    stage?: SortOrder
    status?: SortOrder
    locationId?: SortOrder
    ebayAccountId?: SortOrder
    createdById?: SortOrder
    title?: SortOrder
    description?: SortOrder
    category?: SortOrder
    condition?: SortOrder
    brand?: SortOrder
    features?: SortOrder
    keywords?: SortOrder
    aiAnalysis?: SortOrder
    startingPrice?: SortOrder
    buyNowPrice?: SortOrder
    shippingCost?: SortOrder
    ebayId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ItemAvgOrderByAggregateInput = {
    startingPrice?: SortOrder
    buyNowPrice?: SortOrder
    shippingCost?: SortOrder
  }

  export type ItemMaxOrderByAggregateInput = {
    id?: SortOrder
    sku?: SortOrder
    stage?: SortOrder
    status?: SortOrder
    locationId?: SortOrder
    ebayAccountId?: SortOrder
    createdById?: SortOrder
    title?: SortOrder
    description?: SortOrder
    category?: SortOrder
    condition?: SortOrder
    brand?: SortOrder
    startingPrice?: SortOrder
    buyNowPrice?: SortOrder
    shippingCost?: SortOrder
    ebayId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ItemMinOrderByAggregateInput = {
    id?: SortOrder
    sku?: SortOrder
    stage?: SortOrder
    status?: SortOrder
    locationId?: SortOrder
    ebayAccountId?: SortOrder
    createdById?: SortOrder
    title?: SortOrder
    description?: SortOrder
    category?: SortOrder
    condition?: SortOrder
    brand?: SortOrder
    startingPrice?: SortOrder
    buyNowPrice?: SortOrder
    shippingCost?: SortOrder
    ebayId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ItemSumOrderByAggregateInput = {
    startingPrice?: SortOrder
    buyNowPrice?: SortOrder
    shippingCost?: SortOrder
  }

  export type EnumWorkflowStageWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowStage | EnumWorkflowStageFieldRefInput<$PrismaModel>
    in?: $Enums.WorkflowStage[] | ListEnumWorkflowStageFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkflowStage[] | ListEnumWorkflowStageFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkflowStageWithAggregatesFilter<$PrismaModel> | $Enums.WorkflowStage
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWorkflowStageFilter<$PrismaModel>
    _max?: NestedEnumWorkflowStageFilter<$PrismaModel>
  }

  export type EnumItemStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStatus | EnumItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStatusWithAggregatesFilter<$PrismaModel> | $Enums.ItemStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemStatusFilter<$PrismaModel>
    _max?: NestedEnumItemStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type UserSessionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type UserSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type UserSessionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type ItemScalarRelationFilter = {
    is?: ItemWhereInput
    isNot?: ItemWhereInput
  }

  export type PhotoCountOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    originalPath?: SortOrder
    thumbnailPath?: SortOrder
    optimizedPath?: SortOrder
    isPrimary?: SortOrder
    order?: SortOrder
    analysis?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PhotoAvgOrderByAggregateInput = {
    order?: SortOrder
  }

  export type PhotoMaxOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    originalPath?: SortOrder
    thumbnailPath?: SortOrder
    optimizedPath?: SortOrder
    isPrimary?: SortOrder
    order?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PhotoMinOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    originalPath?: SortOrder
    thumbnailPath?: SortOrder
    optimizedPath?: SortOrder
    isPrimary?: SortOrder
    order?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PhotoSumOrderByAggregateInput = {
    order?: SortOrder
  }

  export type WorkflowActionCountOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    userId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    action?: SortOrder
    notes?: SortOrder
    changes?: SortOrder
    createdAt?: SortOrder
  }

  export type WorkflowActionMaxOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    userId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    action?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
  }

  export type WorkflowActionMinOrderByAggregateInput = {
    id?: SortOrder
    itemId?: SortOrder
    userId?: SortOrder
    fromStage?: SortOrder
    toStage?: SortOrder
    action?: SortOrder
    notes?: SortOrder
    createdAt?: SortOrder
  }

  export type UserCreateNestedManyWithoutLocationInput = {
    create?: XOR<UserCreateWithoutLocationInput, UserUncheckedCreateWithoutLocationInput> | UserCreateWithoutLocationInput[] | UserUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: UserCreateOrConnectWithoutLocationInput | UserCreateOrConnectWithoutLocationInput[]
    createMany?: UserCreateManyLocationInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type ItemCreateNestedManyWithoutLocationInput = {
    create?: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput> | ItemCreateWithoutLocationInput[] | ItemUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutLocationInput | ItemCreateOrConnectWithoutLocationInput[]
    createMany?: ItemCreateManyLocationInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type EbayAccountCreateNestedManyWithoutLocationInput = {
    create?: XOR<EbayAccountCreateWithoutLocationInput, EbayAccountUncheckedCreateWithoutLocationInput> | EbayAccountCreateWithoutLocationInput[] | EbayAccountUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: EbayAccountCreateOrConnectWithoutLocationInput | EbayAccountCreateOrConnectWithoutLocationInput[]
    createMany?: EbayAccountCreateManyLocationInputEnvelope
    connect?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutLocationInput = {
    create?: XOR<UserCreateWithoutLocationInput, UserUncheckedCreateWithoutLocationInput> | UserCreateWithoutLocationInput[] | UserUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: UserCreateOrConnectWithoutLocationInput | UserCreateOrConnectWithoutLocationInput[]
    createMany?: UserCreateManyLocationInputEnvelope
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type ItemUncheckedCreateNestedManyWithoutLocationInput = {
    create?: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput> | ItemCreateWithoutLocationInput[] | ItemUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutLocationInput | ItemCreateOrConnectWithoutLocationInput[]
    createMany?: ItemCreateManyLocationInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type EbayAccountUncheckedCreateNestedManyWithoutLocationInput = {
    create?: XOR<EbayAccountCreateWithoutLocationInput, EbayAccountUncheckedCreateWithoutLocationInput> | EbayAccountCreateWithoutLocationInput[] | EbayAccountUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: EbayAccountCreateOrConnectWithoutLocationInput | EbayAccountCreateOrConnectWithoutLocationInput[]
    createMany?: EbayAccountCreateManyLocationInputEnvelope
    connect?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type UserUpdateManyWithoutLocationNestedInput = {
    create?: XOR<UserCreateWithoutLocationInput, UserUncheckedCreateWithoutLocationInput> | UserCreateWithoutLocationInput[] | UserUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: UserCreateOrConnectWithoutLocationInput | UserCreateOrConnectWithoutLocationInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutLocationInput | UserUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: UserCreateManyLocationInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutLocationInput | UserUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: UserUpdateManyWithWhereWithoutLocationInput | UserUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type ItemUpdateManyWithoutLocationNestedInput = {
    create?: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput> | ItemCreateWithoutLocationInput[] | ItemUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutLocationInput | ItemCreateOrConnectWithoutLocationInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutLocationInput | ItemUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: ItemCreateManyLocationInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutLocationInput | ItemUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutLocationInput | ItemUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type EbayAccountUpdateManyWithoutLocationNestedInput = {
    create?: XOR<EbayAccountCreateWithoutLocationInput, EbayAccountUncheckedCreateWithoutLocationInput> | EbayAccountCreateWithoutLocationInput[] | EbayAccountUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: EbayAccountCreateOrConnectWithoutLocationInput | EbayAccountCreateOrConnectWithoutLocationInput[]
    upsert?: EbayAccountUpsertWithWhereUniqueWithoutLocationInput | EbayAccountUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: EbayAccountCreateManyLocationInputEnvelope
    set?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
    disconnect?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
    delete?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
    connect?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
    update?: EbayAccountUpdateWithWhereUniqueWithoutLocationInput | EbayAccountUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: EbayAccountUpdateManyWithWhereWithoutLocationInput | EbayAccountUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: EbayAccountScalarWhereInput | EbayAccountScalarWhereInput[]
  }

  export type UserUncheckedUpdateManyWithoutLocationNestedInput = {
    create?: XOR<UserCreateWithoutLocationInput, UserUncheckedCreateWithoutLocationInput> | UserCreateWithoutLocationInput[] | UserUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: UserCreateOrConnectWithoutLocationInput | UserCreateOrConnectWithoutLocationInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutLocationInput | UserUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: UserCreateManyLocationInputEnvelope
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutLocationInput | UserUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: UserUpdateManyWithWhereWithoutLocationInput | UserUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type ItemUncheckedUpdateManyWithoutLocationNestedInput = {
    create?: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput> | ItemCreateWithoutLocationInput[] | ItemUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutLocationInput | ItemCreateOrConnectWithoutLocationInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutLocationInput | ItemUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: ItemCreateManyLocationInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutLocationInput | ItemUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutLocationInput | ItemUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type EbayAccountUncheckedUpdateManyWithoutLocationNestedInput = {
    create?: XOR<EbayAccountCreateWithoutLocationInput, EbayAccountUncheckedCreateWithoutLocationInput> | EbayAccountCreateWithoutLocationInput[] | EbayAccountUncheckedCreateWithoutLocationInput[]
    connectOrCreate?: EbayAccountCreateOrConnectWithoutLocationInput | EbayAccountCreateOrConnectWithoutLocationInput[]
    upsert?: EbayAccountUpsertWithWhereUniqueWithoutLocationInput | EbayAccountUpsertWithWhereUniqueWithoutLocationInput[]
    createMany?: EbayAccountCreateManyLocationInputEnvelope
    set?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
    disconnect?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
    delete?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
    connect?: EbayAccountWhereUniqueInput | EbayAccountWhereUniqueInput[]
    update?: EbayAccountUpdateWithWhereUniqueWithoutLocationInput | EbayAccountUpdateWithWhereUniqueWithoutLocationInput[]
    updateMany?: EbayAccountUpdateManyWithWhereWithoutLocationInput | EbayAccountUpdateManyWithWhereWithoutLocationInput[]
    deleteMany?: EbayAccountScalarWhereInput | EbayAccountScalarWhereInput[]
  }

  export type LocationCreateNestedOneWithoutEbayAccountsInput = {
    create?: XOR<LocationCreateWithoutEbayAccountsInput, LocationUncheckedCreateWithoutEbayAccountsInput>
    connectOrCreate?: LocationCreateOrConnectWithoutEbayAccountsInput
    connect?: LocationWhereUniqueInput
  }

  export type ItemCreateNestedManyWithoutEbayAccountInput = {
    create?: XOR<ItemCreateWithoutEbayAccountInput, ItemUncheckedCreateWithoutEbayAccountInput> | ItemCreateWithoutEbayAccountInput[] | ItemUncheckedCreateWithoutEbayAccountInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutEbayAccountInput | ItemCreateOrConnectWithoutEbayAccountInput[]
    createMany?: ItemCreateManyEbayAccountInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type ItemUncheckedCreateNestedManyWithoutEbayAccountInput = {
    create?: XOR<ItemCreateWithoutEbayAccountInput, ItemUncheckedCreateWithoutEbayAccountInput> | ItemCreateWithoutEbayAccountInput[] | ItemUncheckedCreateWithoutEbayAccountInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutEbayAccountInput | ItemCreateOrConnectWithoutEbayAccountInput[]
    createMany?: ItemCreateManyEbayAccountInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type LocationUpdateOneRequiredWithoutEbayAccountsNestedInput = {
    create?: XOR<LocationCreateWithoutEbayAccountsInput, LocationUncheckedCreateWithoutEbayAccountsInput>
    connectOrCreate?: LocationCreateOrConnectWithoutEbayAccountsInput
    upsert?: LocationUpsertWithoutEbayAccountsInput
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutEbayAccountsInput, LocationUpdateWithoutEbayAccountsInput>, LocationUncheckedUpdateWithoutEbayAccountsInput>
  }

  export type ItemUpdateManyWithoutEbayAccountNestedInput = {
    create?: XOR<ItemCreateWithoutEbayAccountInput, ItemUncheckedCreateWithoutEbayAccountInput> | ItemCreateWithoutEbayAccountInput[] | ItemUncheckedCreateWithoutEbayAccountInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutEbayAccountInput | ItemCreateOrConnectWithoutEbayAccountInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutEbayAccountInput | ItemUpsertWithWhereUniqueWithoutEbayAccountInput[]
    createMany?: ItemCreateManyEbayAccountInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutEbayAccountInput | ItemUpdateWithWhereUniqueWithoutEbayAccountInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutEbayAccountInput | ItemUpdateManyWithWhereWithoutEbayAccountInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type ItemUncheckedUpdateManyWithoutEbayAccountNestedInput = {
    create?: XOR<ItemCreateWithoutEbayAccountInput, ItemUncheckedCreateWithoutEbayAccountInput> | ItemCreateWithoutEbayAccountInput[] | ItemUncheckedCreateWithoutEbayAccountInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutEbayAccountInput | ItemCreateOrConnectWithoutEbayAccountInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutEbayAccountInput | ItemUpsertWithWhereUniqueWithoutEbayAccountInput[]
    createMany?: ItemCreateManyEbayAccountInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutEbayAccountInput | ItemUpdateWithWhereUniqueWithoutEbayAccountInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutEbayAccountInput | ItemUpdateManyWithWhereWithoutEbayAccountInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type LocationCreateNestedOneWithoutUsersInput = {
    create?: XOR<LocationCreateWithoutUsersInput, LocationUncheckedCreateWithoutUsersInput>
    connectOrCreate?: LocationCreateOrConnectWithoutUsersInput
    connect?: LocationWhereUniqueInput
  }

  export type ItemCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<ItemCreateWithoutCreatedByInput, ItemUncheckedCreateWithoutCreatedByInput> | ItemCreateWithoutCreatedByInput[] | ItemUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutCreatedByInput | ItemCreateOrConnectWithoutCreatedByInput[]
    createMany?: ItemCreateManyCreatedByInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type WorkflowActionCreateNestedManyWithoutUserInput = {
    create?: XOR<WorkflowActionCreateWithoutUserInput, WorkflowActionUncheckedCreateWithoutUserInput> | WorkflowActionCreateWithoutUserInput[] | WorkflowActionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: WorkflowActionCreateOrConnectWithoutUserInput | WorkflowActionCreateOrConnectWithoutUserInput[]
    createMany?: WorkflowActionCreateManyUserInputEnvelope
    connect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
  }

  export type UserSessionCreateNestedManyWithoutUserInput = {
    create?: XOR<UserSessionCreateWithoutUserInput, UserSessionUncheckedCreateWithoutUserInput> | UserSessionCreateWithoutUserInput[] | UserSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserSessionCreateOrConnectWithoutUserInput | UserSessionCreateOrConnectWithoutUserInput[]
    createMany?: UserSessionCreateManyUserInputEnvelope
    connect?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
  }

  export type ItemUncheckedCreateNestedManyWithoutCreatedByInput = {
    create?: XOR<ItemCreateWithoutCreatedByInput, ItemUncheckedCreateWithoutCreatedByInput> | ItemCreateWithoutCreatedByInput[] | ItemUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutCreatedByInput | ItemCreateOrConnectWithoutCreatedByInput[]
    createMany?: ItemCreateManyCreatedByInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type WorkflowActionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<WorkflowActionCreateWithoutUserInput, WorkflowActionUncheckedCreateWithoutUserInput> | WorkflowActionCreateWithoutUserInput[] | WorkflowActionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: WorkflowActionCreateOrConnectWithoutUserInput | WorkflowActionCreateOrConnectWithoutUserInput[]
    createMany?: WorkflowActionCreateManyUserInputEnvelope
    connect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
  }

  export type UserSessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UserSessionCreateWithoutUserInput, UserSessionUncheckedCreateWithoutUserInput> | UserSessionCreateWithoutUserInput[] | UserSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserSessionCreateOrConnectWithoutUserInput | UserSessionCreateOrConnectWithoutUserInput[]
    createMany?: UserSessionCreateManyUserInputEnvelope
    connect?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type LocationUpdateOneWithoutUsersNestedInput = {
    create?: XOR<LocationCreateWithoutUsersInput, LocationUncheckedCreateWithoutUsersInput>
    connectOrCreate?: LocationCreateOrConnectWithoutUsersInput
    upsert?: LocationUpsertWithoutUsersInput
    disconnect?: LocationWhereInput | boolean
    delete?: LocationWhereInput | boolean
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutUsersInput, LocationUpdateWithoutUsersInput>, LocationUncheckedUpdateWithoutUsersInput>
  }

  export type ItemUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<ItemCreateWithoutCreatedByInput, ItemUncheckedCreateWithoutCreatedByInput> | ItemCreateWithoutCreatedByInput[] | ItemUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutCreatedByInput | ItemCreateOrConnectWithoutCreatedByInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutCreatedByInput | ItemUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: ItemCreateManyCreatedByInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutCreatedByInput | ItemUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutCreatedByInput | ItemUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type WorkflowActionUpdateManyWithoutUserNestedInput = {
    create?: XOR<WorkflowActionCreateWithoutUserInput, WorkflowActionUncheckedCreateWithoutUserInput> | WorkflowActionCreateWithoutUserInput[] | WorkflowActionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: WorkflowActionCreateOrConnectWithoutUserInput | WorkflowActionCreateOrConnectWithoutUserInput[]
    upsert?: WorkflowActionUpsertWithWhereUniqueWithoutUserInput | WorkflowActionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: WorkflowActionCreateManyUserInputEnvelope
    set?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    disconnect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    delete?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    connect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    update?: WorkflowActionUpdateWithWhereUniqueWithoutUserInput | WorkflowActionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: WorkflowActionUpdateManyWithWhereWithoutUserInput | WorkflowActionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: WorkflowActionScalarWhereInput | WorkflowActionScalarWhereInput[]
  }

  export type UserSessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserSessionCreateWithoutUserInput, UserSessionUncheckedCreateWithoutUserInput> | UserSessionCreateWithoutUserInput[] | UserSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserSessionCreateOrConnectWithoutUserInput | UserSessionCreateOrConnectWithoutUserInput[]
    upsert?: UserSessionUpsertWithWhereUniqueWithoutUserInput | UserSessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserSessionCreateManyUserInputEnvelope
    set?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
    disconnect?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
    delete?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
    connect?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
    update?: UserSessionUpdateWithWhereUniqueWithoutUserInput | UserSessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserSessionUpdateManyWithWhereWithoutUserInput | UserSessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserSessionScalarWhereInput | UserSessionScalarWhereInput[]
  }

  export type ItemUncheckedUpdateManyWithoutCreatedByNestedInput = {
    create?: XOR<ItemCreateWithoutCreatedByInput, ItemUncheckedCreateWithoutCreatedByInput> | ItemCreateWithoutCreatedByInput[] | ItemUncheckedCreateWithoutCreatedByInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutCreatedByInput | ItemCreateOrConnectWithoutCreatedByInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutCreatedByInput | ItemUpsertWithWhereUniqueWithoutCreatedByInput[]
    createMany?: ItemCreateManyCreatedByInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutCreatedByInput | ItemUpdateWithWhereUniqueWithoutCreatedByInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutCreatedByInput | ItemUpdateManyWithWhereWithoutCreatedByInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type WorkflowActionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<WorkflowActionCreateWithoutUserInput, WorkflowActionUncheckedCreateWithoutUserInput> | WorkflowActionCreateWithoutUserInput[] | WorkflowActionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: WorkflowActionCreateOrConnectWithoutUserInput | WorkflowActionCreateOrConnectWithoutUserInput[]
    upsert?: WorkflowActionUpsertWithWhereUniqueWithoutUserInput | WorkflowActionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: WorkflowActionCreateManyUserInputEnvelope
    set?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    disconnect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    delete?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    connect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    update?: WorkflowActionUpdateWithWhereUniqueWithoutUserInput | WorkflowActionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: WorkflowActionUpdateManyWithWhereWithoutUserInput | WorkflowActionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: WorkflowActionScalarWhereInput | WorkflowActionScalarWhereInput[]
  }

  export type UserSessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UserSessionCreateWithoutUserInput, UserSessionUncheckedCreateWithoutUserInput> | UserSessionCreateWithoutUserInput[] | UserSessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UserSessionCreateOrConnectWithoutUserInput | UserSessionCreateOrConnectWithoutUserInput[]
    upsert?: UserSessionUpsertWithWhereUniqueWithoutUserInput | UserSessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UserSessionCreateManyUserInputEnvelope
    set?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
    disconnect?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
    delete?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
    connect?: UserSessionWhereUniqueInput | UserSessionWhereUniqueInput[]
    update?: UserSessionUpdateWithWhereUniqueWithoutUserInput | UserSessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UserSessionUpdateManyWithWhereWithoutUserInput | UserSessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UserSessionScalarWhereInput | UserSessionScalarWhereInput[]
  }

  export type ItemCreatefeaturesInput = {
    set: string[]
  }

  export type ItemCreatekeywordsInput = {
    set: string[]
  }

  export type LocationCreateNestedOneWithoutItemsInput = {
    create?: XOR<LocationCreateWithoutItemsInput, LocationUncheckedCreateWithoutItemsInput>
    connectOrCreate?: LocationCreateOrConnectWithoutItemsInput
    connect?: LocationWhereUniqueInput
  }

  export type EbayAccountCreateNestedOneWithoutItemsInput = {
    create?: XOR<EbayAccountCreateWithoutItemsInput, EbayAccountUncheckedCreateWithoutItemsInput>
    connectOrCreate?: EbayAccountCreateOrConnectWithoutItemsInput
    connect?: EbayAccountWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutItemsCreatedInput = {
    create?: XOR<UserCreateWithoutItemsCreatedInput, UserUncheckedCreateWithoutItemsCreatedInput>
    connectOrCreate?: UserCreateOrConnectWithoutItemsCreatedInput
    connect?: UserWhereUniqueInput
  }

  export type PhotoCreateNestedManyWithoutItemInput = {
    create?: XOR<PhotoCreateWithoutItemInput, PhotoUncheckedCreateWithoutItemInput> | PhotoCreateWithoutItemInput[] | PhotoUncheckedCreateWithoutItemInput[]
    connectOrCreate?: PhotoCreateOrConnectWithoutItemInput | PhotoCreateOrConnectWithoutItemInput[]
    createMany?: PhotoCreateManyItemInputEnvelope
    connect?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
  }

  export type WorkflowActionCreateNestedManyWithoutItemInput = {
    create?: XOR<WorkflowActionCreateWithoutItemInput, WorkflowActionUncheckedCreateWithoutItemInput> | WorkflowActionCreateWithoutItemInput[] | WorkflowActionUncheckedCreateWithoutItemInput[]
    connectOrCreate?: WorkflowActionCreateOrConnectWithoutItemInput | WorkflowActionCreateOrConnectWithoutItemInput[]
    createMany?: WorkflowActionCreateManyItemInputEnvelope
    connect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
  }

  export type PhotoUncheckedCreateNestedManyWithoutItemInput = {
    create?: XOR<PhotoCreateWithoutItemInput, PhotoUncheckedCreateWithoutItemInput> | PhotoCreateWithoutItemInput[] | PhotoUncheckedCreateWithoutItemInput[]
    connectOrCreate?: PhotoCreateOrConnectWithoutItemInput | PhotoCreateOrConnectWithoutItemInput[]
    createMany?: PhotoCreateManyItemInputEnvelope
    connect?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
  }

  export type WorkflowActionUncheckedCreateNestedManyWithoutItemInput = {
    create?: XOR<WorkflowActionCreateWithoutItemInput, WorkflowActionUncheckedCreateWithoutItemInput> | WorkflowActionCreateWithoutItemInput[] | WorkflowActionUncheckedCreateWithoutItemInput[]
    connectOrCreate?: WorkflowActionCreateOrConnectWithoutItemInput | WorkflowActionCreateOrConnectWithoutItemInput[]
    createMany?: WorkflowActionCreateManyItemInputEnvelope
    connect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
  }

  export type EnumWorkflowStageFieldUpdateOperationsInput = {
    set?: $Enums.WorkflowStage
  }

  export type EnumItemStatusFieldUpdateOperationsInput = {
    set?: $Enums.ItemStatus
  }

  export type ItemUpdatefeaturesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type ItemUpdatekeywordsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type LocationUpdateOneRequiredWithoutItemsNestedInput = {
    create?: XOR<LocationCreateWithoutItemsInput, LocationUncheckedCreateWithoutItemsInput>
    connectOrCreate?: LocationCreateOrConnectWithoutItemsInput
    upsert?: LocationUpsertWithoutItemsInput
    connect?: LocationWhereUniqueInput
    update?: XOR<XOR<LocationUpdateToOneWithWhereWithoutItemsInput, LocationUpdateWithoutItemsInput>, LocationUncheckedUpdateWithoutItemsInput>
  }

  export type EbayAccountUpdateOneWithoutItemsNestedInput = {
    create?: XOR<EbayAccountCreateWithoutItemsInput, EbayAccountUncheckedCreateWithoutItemsInput>
    connectOrCreate?: EbayAccountCreateOrConnectWithoutItemsInput
    upsert?: EbayAccountUpsertWithoutItemsInput
    disconnect?: EbayAccountWhereInput | boolean
    delete?: EbayAccountWhereInput | boolean
    connect?: EbayAccountWhereUniqueInput
    update?: XOR<XOR<EbayAccountUpdateToOneWithWhereWithoutItemsInput, EbayAccountUpdateWithoutItemsInput>, EbayAccountUncheckedUpdateWithoutItemsInput>
  }

  export type UserUpdateOneRequiredWithoutItemsCreatedNestedInput = {
    create?: XOR<UserCreateWithoutItemsCreatedInput, UserUncheckedCreateWithoutItemsCreatedInput>
    connectOrCreate?: UserCreateOrConnectWithoutItemsCreatedInput
    upsert?: UserUpsertWithoutItemsCreatedInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutItemsCreatedInput, UserUpdateWithoutItemsCreatedInput>, UserUncheckedUpdateWithoutItemsCreatedInput>
  }

  export type PhotoUpdateManyWithoutItemNestedInput = {
    create?: XOR<PhotoCreateWithoutItemInput, PhotoUncheckedCreateWithoutItemInput> | PhotoCreateWithoutItemInput[] | PhotoUncheckedCreateWithoutItemInput[]
    connectOrCreate?: PhotoCreateOrConnectWithoutItemInput | PhotoCreateOrConnectWithoutItemInput[]
    upsert?: PhotoUpsertWithWhereUniqueWithoutItemInput | PhotoUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: PhotoCreateManyItemInputEnvelope
    set?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
    disconnect?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
    delete?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
    connect?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
    update?: PhotoUpdateWithWhereUniqueWithoutItemInput | PhotoUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: PhotoUpdateManyWithWhereWithoutItemInput | PhotoUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: PhotoScalarWhereInput | PhotoScalarWhereInput[]
  }

  export type WorkflowActionUpdateManyWithoutItemNestedInput = {
    create?: XOR<WorkflowActionCreateWithoutItemInput, WorkflowActionUncheckedCreateWithoutItemInput> | WorkflowActionCreateWithoutItemInput[] | WorkflowActionUncheckedCreateWithoutItemInput[]
    connectOrCreate?: WorkflowActionCreateOrConnectWithoutItemInput | WorkflowActionCreateOrConnectWithoutItemInput[]
    upsert?: WorkflowActionUpsertWithWhereUniqueWithoutItemInput | WorkflowActionUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: WorkflowActionCreateManyItemInputEnvelope
    set?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    disconnect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    delete?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    connect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    update?: WorkflowActionUpdateWithWhereUniqueWithoutItemInput | WorkflowActionUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: WorkflowActionUpdateManyWithWhereWithoutItemInput | WorkflowActionUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: WorkflowActionScalarWhereInput | WorkflowActionScalarWhereInput[]
  }

  export type PhotoUncheckedUpdateManyWithoutItemNestedInput = {
    create?: XOR<PhotoCreateWithoutItemInput, PhotoUncheckedCreateWithoutItemInput> | PhotoCreateWithoutItemInput[] | PhotoUncheckedCreateWithoutItemInput[]
    connectOrCreate?: PhotoCreateOrConnectWithoutItemInput | PhotoCreateOrConnectWithoutItemInput[]
    upsert?: PhotoUpsertWithWhereUniqueWithoutItemInput | PhotoUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: PhotoCreateManyItemInputEnvelope
    set?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
    disconnect?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
    delete?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
    connect?: PhotoWhereUniqueInput | PhotoWhereUniqueInput[]
    update?: PhotoUpdateWithWhereUniqueWithoutItemInput | PhotoUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: PhotoUpdateManyWithWhereWithoutItemInput | PhotoUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: PhotoScalarWhereInput | PhotoScalarWhereInput[]
  }

  export type WorkflowActionUncheckedUpdateManyWithoutItemNestedInput = {
    create?: XOR<WorkflowActionCreateWithoutItemInput, WorkflowActionUncheckedCreateWithoutItemInput> | WorkflowActionCreateWithoutItemInput[] | WorkflowActionUncheckedCreateWithoutItemInput[]
    connectOrCreate?: WorkflowActionCreateOrConnectWithoutItemInput | WorkflowActionCreateOrConnectWithoutItemInput[]
    upsert?: WorkflowActionUpsertWithWhereUniqueWithoutItemInput | WorkflowActionUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: WorkflowActionCreateManyItemInputEnvelope
    set?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    disconnect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    delete?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    connect?: WorkflowActionWhereUniqueInput | WorkflowActionWhereUniqueInput[]
    update?: WorkflowActionUpdateWithWhereUniqueWithoutItemInput | WorkflowActionUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: WorkflowActionUpdateManyWithWhereWithoutItemInput | WorkflowActionUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: WorkflowActionScalarWhereInput | WorkflowActionScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutSessionsInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    upsert?: UserUpsertWithoutSessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSessionsInput, UserUpdateWithoutSessionsInput>, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type ItemCreateNestedOneWithoutPhotosInput = {
    create?: XOR<ItemCreateWithoutPhotosInput, ItemUncheckedCreateWithoutPhotosInput>
    connectOrCreate?: ItemCreateOrConnectWithoutPhotosInput
    connect?: ItemWhereUniqueInput
  }

  export type ItemUpdateOneRequiredWithoutPhotosNestedInput = {
    create?: XOR<ItemCreateWithoutPhotosInput, ItemUncheckedCreateWithoutPhotosInput>
    connectOrCreate?: ItemCreateOrConnectWithoutPhotosInput
    upsert?: ItemUpsertWithoutPhotosInput
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutPhotosInput, ItemUpdateWithoutPhotosInput>, ItemUncheckedUpdateWithoutPhotosInput>
  }

  export type ItemCreateNestedOneWithoutWorkflowActionsInput = {
    create?: XOR<ItemCreateWithoutWorkflowActionsInput, ItemUncheckedCreateWithoutWorkflowActionsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutWorkflowActionsInput
    connect?: ItemWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutWorkflowActionsInput = {
    create?: XOR<UserCreateWithoutWorkflowActionsInput, UserUncheckedCreateWithoutWorkflowActionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutWorkflowActionsInput
    connect?: UserWhereUniqueInput
  }

  export type ItemUpdateOneRequiredWithoutWorkflowActionsNestedInput = {
    create?: XOR<ItemCreateWithoutWorkflowActionsInput, ItemUncheckedCreateWithoutWorkflowActionsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutWorkflowActionsInput
    upsert?: ItemUpsertWithoutWorkflowActionsInput
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutWorkflowActionsInput, ItemUpdateWithoutWorkflowActionsInput>, ItemUncheckedUpdateWithoutWorkflowActionsInput>
  }

  export type UserUpdateOneRequiredWithoutWorkflowActionsNestedInput = {
    create?: XOR<UserCreateWithoutWorkflowActionsInput, UserUncheckedCreateWithoutWorkflowActionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutWorkflowActionsInput
    upsert?: UserUpsertWithoutWorkflowActionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutWorkflowActionsInput, UserUpdateWithoutWorkflowActionsInput>, UserUncheckedUpdateWithoutWorkflowActionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type NestedEnumWorkflowStageFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowStage | EnumWorkflowStageFieldRefInput<$PrismaModel>
    in?: $Enums.WorkflowStage[] | ListEnumWorkflowStageFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkflowStage[] | ListEnumWorkflowStageFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkflowStageFilter<$PrismaModel> | $Enums.WorkflowStage
  }

  export type NestedEnumItemStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStatus | EnumItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStatusFilter<$PrismaModel> | $Enums.ItemStatus
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumWorkflowStageWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowStage | EnumWorkflowStageFieldRefInput<$PrismaModel>
    in?: $Enums.WorkflowStage[] | ListEnumWorkflowStageFieldRefInput<$PrismaModel>
    notIn?: $Enums.WorkflowStage[] | ListEnumWorkflowStageFieldRefInput<$PrismaModel>
    not?: NestedEnumWorkflowStageWithAggregatesFilter<$PrismaModel> | $Enums.WorkflowStage
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWorkflowStageFilter<$PrismaModel>
    _max?: NestedEnumWorkflowStageFilter<$PrismaModel>
  }

  export type NestedEnumItemStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStatus | EnumItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStatusWithAggregatesFilter<$PrismaModel> | $Enums.ItemStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemStatusFilter<$PrismaModel>
    _max?: NestedEnumItemStatusFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type UserCreateWithoutLocationInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    itemsCreated?: ItemCreateNestedManyWithoutCreatedByInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutUserInput
    sessions?: UserSessionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLocationInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    itemsCreated?: ItemUncheckedCreateNestedManyWithoutCreatedByInput
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutUserInput
    sessions?: UserSessionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLocationInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLocationInput, UserUncheckedCreateWithoutLocationInput>
  }

  export type UserCreateManyLocationInputEnvelope = {
    data: UserCreateManyLocationInput | UserCreateManyLocationInput[]
    skipDuplicates?: boolean
  }

  export type ItemCreateWithoutLocationInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    ebayAccount?: EbayAccountCreateNestedOneWithoutItemsInput
    createdBy: UserCreateNestedOneWithoutItemsCreatedInput
    photos?: PhotoCreateNestedManyWithoutItemInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutLocationInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    ebayAccountId?: string | null
    createdById: string
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    photos?: PhotoUncheckedCreateNestedManyWithoutItemInput
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutLocationInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput>
  }

  export type ItemCreateManyLocationInputEnvelope = {
    data: ItemCreateManyLocationInput | ItemCreateManyLocationInput[]
    skipDuplicates?: boolean
  }

  export type EbayAccountCreateWithoutLocationInput = {
    id?: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken?: string | null
    refreshToken?: string | null
    sandbox?: boolean
    siteId?: number
    paypalEmail?: string | null
    postalCode?: string | null
    isActive?: boolean
    lastSync?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: ItemCreateNestedManyWithoutEbayAccountInput
  }

  export type EbayAccountUncheckedCreateWithoutLocationInput = {
    id?: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken?: string | null
    refreshToken?: string | null
    sandbox?: boolean
    siteId?: number
    paypalEmail?: string | null
    postalCode?: string | null
    isActive?: boolean
    lastSync?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: ItemUncheckedCreateNestedManyWithoutEbayAccountInput
  }

  export type EbayAccountCreateOrConnectWithoutLocationInput = {
    where: EbayAccountWhereUniqueInput
    create: XOR<EbayAccountCreateWithoutLocationInput, EbayAccountUncheckedCreateWithoutLocationInput>
  }

  export type EbayAccountCreateManyLocationInputEnvelope = {
    data: EbayAccountCreateManyLocationInput | EbayAccountCreateManyLocationInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithWhereUniqueWithoutLocationInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutLocationInput, UserUncheckedUpdateWithoutLocationInput>
    create: XOR<UserCreateWithoutLocationInput, UserUncheckedCreateWithoutLocationInput>
  }

  export type UserUpdateWithWhereUniqueWithoutLocationInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutLocationInput, UserUncheckedUpdateWithoutLocationInput>
  }

  export type UserUpdateManyWithWhereWithoutLocationInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutLocationInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    password?: StringFilter<"User"> | string
    locationId?: StringNullableFilter<"User"> | string | null
    lastActive?: DateTimeNullableFilter<"User"> | Date | string | null
    isOnline?: BoolFilter<"User"> | boolean
    currentItemId?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }

  export type ItemUpsertWithWhereUniqueWithoutLocationInput = {
    where: ItemWhereUniqueInput
    update: XOR<ItemUpdateWithoutLocationInput, ItemUncheckedUpdateWithoutLocationInput>
    create: XOR<ItemCreateWithoutLocationInput, ItemUncheckedCreateWithoutLocationInput>
  }

  export type ItemUpdateWithWhereUniqueWithoutLocationInput = {
    where: ItemWhereUniqueInput
    data: XOR<ItemUpdateWithoutLocationInput, ItemUncheckedUpdateWithoutLocationInput>
  }

  export type ItemUpdateManyWithWhereWithoutLocationInput = {
    where: ItemScalarWhereInput
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyWithoutLocationInput>
  }

  export type ItemScalarWhereInput = {
    AND?: ItemScalarWhereInput | ItemScalarWhereInput[]
    OR?: ItemScalarWhereInput[]
    NOT?: ItemScalarWhereInput | ItemScalarWhereInput[]
    id?: StringFilter<"Item"> | string
    sku?: StringNullableFilter<"Item"> | string | null
    stage?: EnumWorkflowStageFilter<"Item"> | $Enums.WorkflowStage
    status?: EnumItemStatusFilter<"Item"> | $Enums.ItemStatus
    locationId?: StringFilter<"Item"> | string
    ebayAccountId?: StringNullableFilter<"Item"> | string | null
    createdById?: StringFilter<"Item"> | string
    title?: StringNullableFilter<"Item"> | string | null
    description?: StringNullableFilter<"Item"> | string | null
    category?: StringNullableFilter<"Item"> | string | null
    condition?: StringNullableFilter<"Item"> | string | null
    brand?: StringNullableFilter<"Item"> | string | null
    features?: StringNullableListFilter<"Item">
    keywords?: StringNullableListFilter<"Item">
    aiAnalysis?: JsonNullableFilter<"Item">
    startingPrice?: FloatNullableFilter<"Item"> | number | null
    buyNowPrice?: FloatNullableFilter<"Item"> | number | null
    shippingCost?: FloatNullableFilter<"Item"> | number | null
    ebayId?: StringNullableFilter<"Item"> | string | null
    publishedAt?: DateTimeNullableFilter<"Item"> | Date | string | null
    createdAt?: DateTimeFilter<"Item"> | Date | string
    updatedAt?: DateTimeFilter<"Item"> | Date | string
  }

  export type EbayAccountUpsertWithWhereUniqueWithoutLocationInput = {
    where: EbayAccountWhereUniqueInput
    update: XOR<EbayAccountUpdateWithoutLocationInput, EbayAccountUncheckedUpdateWithoutLocationInput>
    create: XOR<EbayAccountCreateWithoutLocationInput, EbayAccountUncheckedCreateWithoutLocationInput>
  }

  export type EbayAccountUpdateWithWhereUniqueWithoutLocationInput = {
    where: EbayAccountWhereUniqueInput
    data: XOR<EbayAccountUpdateWithoutLocationInput, EbayAccountUncheckedUpdateWithoutLocationInput>
  }

  export type EbayAccountUpdateManyWithWhereWithoutLocationInput = {
    where: EbayAccountScalarWhereInput
    data: XOR<EbayAccountUpdateManyMutationInput, EbayAccountUncheckedUpdateManyWithoutLocationInput>
  }

  export type EbayAccountScalarWhereInput = {
    AND?: EbayAccountScalarWhereInput | EbayAccountScalarWhereInput[]
    OR?: EbayAccountScalarWhereInput[]
    NOT?: EbayAccountScalarWhereInput | EbayAccountScalarWhereInput[]
    id?: StringFilter<"EbayAccount"> | string
    accountName?: StringFilter<"EbayAccount"> | string
    email?: StringFilter<"EbayAccount"> | string
    appId?: StringFilter<"EbayAccount"> | string
    certId?: StringFilter<"EbayAccount"> | string
    devId?: StringFilter<"EbayAccount"> | string
    authToken?: StringNullableFilter<"EbayAccount"> | string | null
    refreshToken?: StringNullableFilter<"EbayAccount"> | string | null
    sandbox?: BoolFilter<"EbayAccount"> | boolean
    siteId?: IntFilter<"EbayAccount"> | number
    paypalEmail?: StringNullableFilter<"EbayAccount"> | string | null
    postalCode?: StringNullableFilter<"EbayAccount"> | string | null
    isActive?: BoolFilter<"EbayAccount"> | boolean
    lastSync?: DateTimeNullableFilter<"EbayAccount"> | Date | string | null
    locationId?: StringFilter<"EbayAccount"> | string
    createdAt?: DateTimeFilter<"EbayAccount"> | Date | string
    updatedAt?: DateTimeFilter<"EbayAccount"> | Date | string
  }

  export type LocationCreateWithoutEbayAccountsInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserCreateNestedManyWithoutLocationInput
    items?: ItemCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateWithoutEbayAccountsInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutLocationInput
    items?: ItemUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationCreateOrConnectWithoutEbayAccountsInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutEbayAccountsInput, LocationUncheckedCreateWithoutEbayAccountsInput>
  }

  export type ItemCreateWithoutEbayAccountInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location: LocationCreateNestedOneWithoutItemsInput
    createdBy: UserCreateNestedOneWithoutItemsCreatedInput
    photos?: PhotoCreateNestedManyWithoutItemInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutEbayAccountInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    locationId: string
    createdById: string
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    photos?: PhotoUncheckedCreateNestedManyWithoutItemInput
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutEbayAccountInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutEbayAccountInput, ItemUncheckedCreateWithoutEbayAccountInput>
  }

  export type ItemCreateManyEbayAccountInputEnvelope = {
    data: ItemCreateManyEbayAccountInput | ItemCreateManyEbayAccountInput[]
    skipDuplicates?: boolean
  }

  export type LocationUpsertWithoutEbayAccountsInput = {
    update: XOR<LocationUpdateWithoutEbayAccountsInput, LocationUncheckedUpdateWithoutEbayAccountsInput>
    create: XOR<LocationCreateWithoutEbayAccountsInput, LocationUncheckedCreateWithoutEbayAccountsInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutEbayAccountsInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutEbayAccountsInput, LocationUncheckedUpdateWithoutEbayAccountsInput>
  }

  export type LocationUpdateWithoutEbayAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutLocationNestedInput
    items?: ItemUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateWithoutEbayAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutLocationNestedInput
    items?: ItemUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type ItemUpsertWithWhereUniqueWithoutEbayAccountInput = {
    where: ItemWhereUniqueInput
    update: XOR<ItemUpdateWithoutEbayAccountInput, ItemUncheckedUpdateWithoutEbayAccountInput>
    create: XOR<ItemCreateWithoutEbayAccountInput, ItemUncheckedCreateWithoutEbayAccountInput>
  }

  export type ItemUpdateWithWhereUniqueWithoutEbayAccountInput = {
    where: ItemWhereUniqueInput
    data: XOR<ItemUpdateWithoutEbayAccountInput, ItemUncheckedUpdateWithoutEbayAccountInput>
  }

  export type ItemUpdateManyWithWhereWithoutEbayAccountInput = {
    where: ItemScalarWhereInput
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyWithoutEbayAccountInput>
  }

  export type LocationCreateWithoutUsersInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: ItemCreateNestedManyWithoutLocationInput
    ebayAccounts?: EbayAccountCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateWithoutUsersInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: ItemUncheckedCreateNestedManyWithoutLocationInput
    ebayAccounts?: EbayAccountUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationCreateOrConnectWithoutUsersInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutUsersInput, LocationUncheckedCreateWithoutUsersInput>
  }

  export type ItemCreateWithoutCreatedByInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location: LocationCreateNestedOneWithoutItemsInput
    ebayAccount?: EbayAccountCreateNestedOneWithoutItemsInput
    photos?: PhotoCreateNestedManyWithoutItemInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutCreatedByInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    locationId: string
    ebayAccountId?: string | null
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    photos?: PhotoUncheckedCreateNestedManyWithoutItemInput
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutCreatedByInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutCreatedByInput, ItemUncheckedCreateWithoutCreatedByInput>
  }

  export type ItemCreateManyCreatedByInputEnvelope = {
    data: ItemCreateManyCreatedByInput | ItemCreateManyCreatedByInput[]
    skipDuplicates?: boolean
  }

  export type WorkflowActionCreateWithoutUserInput = {
    id?: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    item: ItemCreateNestedOneWithoutWorkflowActionsInput
  }

  export type WorkflowActionUncheckedCreateWithoutUserInput = {
    id?: string
    itemId: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type WorkflowActionCreateOrConnectWithoutUserInput = {
    where: WorkflowActionWhereUniqueInput
    create: XOR<WorkflowActionCreateWithoutUserInput, WorkflowActionUncheckedCreateWithoutUserInput>
  }

  export type WorkflowActionCreateManyUserInputEnvelope = {
    data: WorkflowActionCreateManyUserInput | WorkflowActionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type UserSessionCreateWithoutUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type UserSessionUncheckedCreateWithoutUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type UserSessionCreateOrConnectWithoutUserInput = {
    where: UserSessionWhereUniqueInput
    create: XOR<UserSessionCreateWithoutUserInput, UserSessionUncheckedCreateWithoutUserInput>
  }

  export type UserSessionCreateManyUserInputEnvelope = {
    data: UserSessionCreateManyUserInput | UserSessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type LocationUpsertWithoutUsersInput = {
    update: XOR<LocationUpdateWithoutUsersInput, LocationUncheckedUpdateWithoutUsersInput>
    create: XOR<LocationCreateWithoutUsersInput, LocationUncheckedCreateWithoutUsersInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutUsersInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutUsersInput, LocationUncheckedUpdateWithoutUsersInput>
  }

  export type LocationUpdateWithoutUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ItemUpdateManyWithoutLocationNestedInput
    ebayAccounts?: EbayAccountUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateWithoutUsersInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ItemUncheckedUpdateManyWithoutLocationNestedInput
    ebayAccounts?: EbayAccountUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type ItemUpsertWithWhereUniqueWithoutCreatedByInput = {
    where: ItemWhereUniqueInput
    update: XOR<ItemUpdateWithoutCreatedByInput, ItemUncheckedUpdateWithoutCreatedByInput>
    create: XOR<ItemCreateWithoutCreatedByInput, ItemUncheckedCreateWithoutCreatedByInput>
  }

  export type ItemUpdateWithWhereUniqueWithoutCreatedByInput = {
    where: ItemWhereUniqueInput
    data: XOR<ItemUpdateWithoutCreatedByInput, ItemUncheckedUpdateWithoutCreatedByInput>
  }

  export type ItemUpdateManyWithWhereWithoutCreatedByInput = {
    where: ItemScalarWhereInput
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyWithoutCreatedByInput>
  }

  export type WorkflowActionUpsertWithWhereUniqueWithoutUserInput = {
    where: WorkflowActionWhereUniqueInput
    update: XOR<WorkflowActionUpdateWithoutUserInput, WorkflowActionUncheckedUpdateWithoutUserInput>
    create: XOR<WorkflowActionCreateWithoutUserInput, WorkflowActionUncheckedCreateWithoutUserInput>
  }

  export type WorkflowActionUpdateWithWhereUniqueWithoutUserInput = {
    where: WorkflowActionWhereUniqueInput
    data: XOR<WorkflowActionUpdateWithoutUserInput, WorkflowActionUncheckedUpdateWithoutUserInput>
  }

  export type WorkflowActionUpdateManyWithWhereWithoutUserInput = {
    where: WorkflowActionScalarWhereInput
    data: XOR<WorkflowActionUpdateManyMutationInput, WorkflowActionUncheckedUpdateManyWithoutUserInput>
  }

  export type WorkflowActionScalarWhereInput = {
    AND?: WorkflowActionScalarWhereInput | WorkflowActionScalarWhereInput[]
    OR?: WorkflowActionScalarWhereInput[]
    NOT?: WorkflowActionScalarWhereInput | WorkflowActionScalarWhereInput[]
    id?: StringFilter<"WorkflowAction"> | string
    itemId?: StringFilter<"WorkflowAction"> | string
    userId?: StringFilter<"WorkflowAction"> | string
    fromStage?: EnumWorkflowStageFilter<"WorkflowAction"> | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFilter<"WorkflowAction"> | $Enums.WorkflowStage
    action?: StringFilter<"WorkflowAction"> | string
    notes?: StringNullableFilter<"WorkflowAction"> | string | null
    changes?: JsonNullableFilter<"WorkflowAction">
    createdAt?: DateTimeFilter<"WorkflowAction"> | Date | string
  }

  export type UserSessionUpsertWithWhereUniqueWithoutUserInput = {
    where: UserSessionWhereUniqueInput
    update: XOR<UserSessionUpdateWithoutUserInput, UserSessionUncheckedUpdateWithoutUserInput>
    create: XOR<UserSessionCreateWithoutUserInput, UserSessionUncheckedCreateWithoutUserInput>
  }

  export type UserSessionUpdateWithWhereUniqueWithoutUserInput = {
    where: UserSessionWhereUniqueInput
    data: XOR<UserSessionUpdateWithoutUserInput, UserSessionUncheckedUpdateWithoutUserInput>
  }

  export type UserSessionUpdateManyWithWhereWithoutUserInput = {
    where: UserSessionScalarWhereInput
    data: XOR<UserSessionUpdateManyMutationInput, UserSessionUncheckedUpdateManyWithoutUserInput>
  }

  export type UserSessionScalarWhereInput = {
    AND?: UserSessionScalarWhereInput | UserSessionScalarWhereInput[]
    OR?: UserSessionScalarWhereInput[]
    NOT?: UserSessionScalarWhereInput | UserSessionScalarWhereInput[]
    id?: StringFilter<"UserSession"> | string
    userId?: StringFilter<"UserSession"> | string
    token?: StringFilter<"UserSession"> | string
    expiresAt?: DateTimeFilter<"UserSession"> | Date | string
    createdAt?: DateTimeFilter<"UserSession"> | Date | string
  }

  export type LocationCreateWithoutItemsInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserCreateNestedManyWithoutLocationInput
    ebayAccounts?: EbayAccountCreateNestedManyWithoutLocationInput
  }

  export type LocationUncheckedCreateWithoutItemsInput = {
    id?: string
    name: string
    code: string
    address?: string | null
    timezone?: string
    isActive?: boolean
    serverUrl?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    users?: UserUncheckedCreateNestedManyWithoutLocationInput
    ebayAccounts?: EbayAccountUncheckedCreateNestedManyWithoutLocationInput
  }

  export type LocationCreateOrConnectWithoutItemsInput = {
    where: LocationWhereUniqueInput
    create: XOR<LocationCreateWithoutItemsInput, LocationUncheckedCreateWithoutItemsInput>
  }

  export type EbayAccountCreateWithoutItemsInput = {
    id?: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken?: string | null
    refreshToken?: string | null
    sandbox?: boolean
    siteId?: number
    paypalEmail?: string | null
    postalCode?: string | null
    isActive?: boolean
    lastSync?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location: LocationCreateNestedOneWithoutEbayAccountsInput
  }

  export type EbayAccountUncheckedCreateWithoutItemsInput = {
    id?: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken?: string | null
    refreshToken?: string | null
    sandbox?: boolean
    siteId?: number
    paypalEmail?: string | null
    postalCode?: string | null
    isActive?: boolean
    lastSync?: Date | string | null
    locationId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EbayAccountCreateOrConnectWithoutItemsInput = {
    where: EbayAccountWhereUniqueInput
    create: XOR<EbayAccountCreateWithoutItemsInput, EbayAccountUncheckedCreateWithoutItemsInput>
  }

  export type UserCreateWithoutItemsCreatedInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location?: LocationCreateNestedOneWithoutUsersInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutUserInput
    sessions?: UserSessionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutItemsCreatedInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    locationId?: string | null
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutUserInput
    sessions?: UserSessionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutItemsCreatedInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutItemsCreatedInput, UserUncheckedCreateWithoutItemsCreatedInput>
  }

  export type PhotoCreateWithoutItemInput = {
    id?: string
    originalPath: string
    thumbnailPath?: string | null
    optimizedPath?: string | null
    isPrimary?: boolean
    order?: number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PhotoUncheckedCreateWithoutItemInput = {
    id?: string
    originalPath: string
    thumbnailPath?: string | null
    optimizedPath?: string | null
    isPrimary?: boolean
    order?: number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PhotoCreateOrConnectWithoutItemInput = {
    where: PhotoWhereUniqueInput
    create: XOR<PhotoCreateWithoutItemInput, PhotoUncheckedCreateWithoutItemInput>
  }

  export type PhotoCreateManyItemInputEnvelope = {
    data: PhotoCreateManyItemInput | PhotoCreateManyItemInput[]
    skipDuplicates?: boolean
  }

  export type WorkflowActionCreateWithoutItemInput = {
    id?: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutWorkflowActionsInput
  }

  export type WorkflowActionUncheckedCreateWithoutItemInput = {
    id?: string
    userId: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type WorkflowActionCreateOrConnectWithoutItemInput = {
    where: WorkflowActionWhereUniqueInput
    create: XOR<WorkflowActionCreateWithoutItemInput, WorkflowActionUncheckedCreateWithoutItemInput>
  }

  export type WorkflowActionCreateManyItemInputEnvelope = {
    data: WorkflowActionCreateManyItemInput | WorkflowActionCreateManyItemInput[]
    skipDuplicates?: boolean
  }

  export type LocationUpsertWithoutItemsInput = {
    update: XOR<LocationUpdateWithoutItemsInput, LocationUncheckedUpdateWithoutItemsInput>
    create: XOR<LocationCreateWithoutItemsInput, LocationUncheckedCreateWithoutItemsInput>
    where?: LocationWhereInput
  }

  export type LocationUpdateToOneWithWhereWithoutItemsInput = {
    where?: LocationWhereInput
    data: XOR<LocationUpdateWithoutItemsInput, LocationUncheckedUpdateWithoutItemsInput>
  }

  export type LocationUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUpdateManyWithoutLocationNestedInput
    ebayAccounts?: EbayAccountUpdateManyWithoutLocationNestedInput
  }

  export type LocationUncheckedUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    address?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    serverUrl?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    users?: UserUncheckedUpdateManyWithoutLocationNestedInput
    ebayAccounts?: EbayAccountUncheckedUpdateManyWithoutLocationNestedInput
  }

  export type EbayAccountUpsertWithoutItemsInput = {
    update: XOR<EbayAccountUpdateWithoutItemsInput, EbayAccountUncheckedUpdateWithoutItemsInput>
    create: XOR<EbayAccountCreateWithoutItemsInput, EbayAccountUncheckedCreateWithoutItemsInput>
    where?: EbayAccountWhereInput
  }

  export type EbayAccountUpdateToOneWithWhereWithoutItemsInput = {
    where?: EbayAccountWhereInput
    data: XOR<EbayAccountUpdateWithoutItemsInput, EbayAccountUncheckedUpdateWithoutItemsInput>
  }

  export type EbayAccountUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneRequiredWithoutEbayAccountsNestedInput
  }

  export type EbayAccountUncheckedUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    locationId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUpsertWithoutItemsCreatedInput = {
    update: XOR<UserUpdateWithoutItemsCreatedInput, UserUncheckedUpdateWithoutItemsCreatedInput>
    create: XOR<UserCreateWithoutItemsCreatedInput, UserUncheckedCreateWithoutItemsCreatedInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutItemsCreatedInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutItemsCreatedInput, UserUncheckedUpdateWithoutItemsCreatedInput>
  }

  export type UserUpdateWithoutItemsCreatedInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneWithoutUsersNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutUserNestedInput
    sessions?: UserSessionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutItemsCreatedInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutUserNestedInput
    sessions?: UserSessionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type PhotoUpsertWithWhereUniqueWithoutItemInput = {
    where: PhotoWhereUniqueInput
    update: XOR<PhotoUpdateWithoutItemInput, PhotoUncheckedUpdateWithoutItemInput>
    create: XOR<PhotoCreateWithoutItemInput, PhotoUncheckedCreateWithoutItemInput>
  }

  export type PhotoUpdateWithWhereUniqueWithoutItemInput = {
    where: PhotoWhereUniqueInput
    data: XOR<PhotoUpdateWithoutItemInput, PhotoUncheckedUpdateWithoutItemInput>
  }

  export type PhotoUpdateManyWithWhereWithoutItemInput = {
    where: PhotoScalarWhereInput
    data: XOR<PhotoUpdateManyMutationInput, PhotoUncheckedUpdateManyWithoutItemInput>
  }

  export type PhotoScalarWhereInput = {
    AND?: PhotoScalarWhereInput | PhotoScalarWhereInput[]
    OR?: PhotoScalarWhereInput[]
    NOT?: PhotoScalarWhereInput | PhotoScalarWhereInput[]
    id?: StringFilter<"Photo"> | string
    itemId?: StringFilter<"Photo"> | string
    originalPath?: StringFilter<"Photo"> | string
    thumbnailPath?: StringNullableFilter<"Photo"> | string | null
    optimizedPath?: StringNullableFilter<"Photo"> | string | null
    isPrimary?: BoolFilter<"Photo"> | boolean
    order?: IntFilter<"Photo"> | number
    analysis?: JsonNullableFilter<"Photo">
    processedAt?: DateTimeNullableFilter<"Photo"> | Date | string | null
    createdAt?: DateTimeFilter<"Photo"> | Date | string
    updatedAt?: DateTimeFilter<"Photo"> | Date | string
  }

  export type WorkflowActionUpsertWithWhereUniqueWithoutItemInput = {
    where: WorkflowActionWhereUniqueInput
    update: XOR<WorkflowActionUpdateWithoutItemInput, WorkflowActionUncheckedUpdateWithoutItemInput>
    create: XOR<WorkflowActionCreateWithoutItemInput, WorkflowActionUncheckedCreateWithoutItemInput>
  }

  export type WorkflowActionUpdateWithWhereUniqueWithoutItemInput = {
    where: WorkflowActionWhereUniqueInput
    data: XOR<WorkflowActionUpdateWithoutItemInput, WorkflowActionUncheckedUpdateWithoutItemInput>
  }

  export type WorkflowActionUpdateManyWithWhereWithoutItemInput = {
    where: WorkflowActionScalarWhereInput
    data: XOR<WorkflowActionUpdateManyMutationInput, WorkflowActionUncheckedUpdateManyWithoutItemInput>
  }

  export type UserCreateWithoutSessionsInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location?: LocationCreateNestedOneWithoutUsersInput
    itemsCreated?: ItemCreateNestedManyWithoutCreatedByInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSessionsInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    locationId?: string | null
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    itemsCreated?: ItemUncheckedCreateNestedManyWithoutCreatedByInput
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
  }

  export type UserUpsertWithoutSessionsInput = {
    update: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneWithoutUsersNestedInput
    itemsCreated?: ItemUpdateManyWithoutCreatedByNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    itemsCreated?: ItemUncheckedUpdateManyWithoutCreatedByNestedInput
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ItemCreateWithoutPhotosInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location: LocationCreateNestedOneWithoutItemsInput
    ebayAccount?: EbayAccountCreateNestedOneWithoutItemsInput
    createdBy: UserCreateNestedOneWithoutItemsCreatedInput
    workflowActions?: WorkflowActionCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutPhotosInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    locationId: string
    ebayAccountId?: string | null
    createdById: string
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    workflowActions?: WorkflowActionUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutPhotosInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutPhotosInput, ItemUncheckedCreateWithoutPhotosInput>
  }

  export type ItemUpsertWithoutPhotosInput = {
    update: XOR<ItemUpdateWithoutPhotosInput, ItemUncheckedUpdateWithoutPhotosInput>
    create: XOR<ItemCreateWithoutPhotosInput, ItemUncheckedCreateWithoutPhotosInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutPhotosInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutPhotosInput, ItemUncheckedUpdateWithoutPhotosInput>
  }

  export type ItemUpdateWithoutPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneRequiredWithoutItemsNestedInput
    ebayAccount?: EbayAccountUpdateOneWithoutItemsNestedInput
    createdBy?: UserUpdateOneRequiredWithoutItemsCreatedNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    locationId?: StringFieldUpdateOperationsInput | string
    ebayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemCreateWithoutWorkflowActionsInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location: LocationCreateNestedOneWithoutItemsInput
    ebayAccount?: EbayAccountCreateNestedOneWithoutItemsInput
    createdBy: UserCreateNestedOneWithoutItemsCreatedInput
    photos?: PhotoCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutWorkflowActionsInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    locationId: string
    ebayAccountId?: string | null
    createdById: string
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    photos?: PhotoUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutWorkflowActionsInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutWorkflowActionsInput, ItemUncheckedCreateWithoutWorkflowActionsInput>
  }

  export type UserCreateWithoutWorkflowActionsInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    location?: LocationCreateNestedOneWithoutUsersInput
    itemsCreated?: ItemCreateNestedManyWithoutCreatedByInput
    sessions?: UserSessionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutWorkflowActionsInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    locationId?: string | null
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    itemsCreated?: ItemUncheckedCreateNestedManyWithoutCreatedByInput
    sessions?: UserSessionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutWorkflowActionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutWorkflowActionsInput, UserUncheckedCreateWithoutWorkflowActionsInput>
  }

  export type ItemUpsertWithoutWorkflowActionsInput = {
    update: XOR<ItemUpdateWithoutWorkflowActionsInput, ItemUncheckedUpdateWithoutWorkflowActionsInput>
    create: XOR<ItemCreateWithoutWorkflowActionsInput, ItemUncheckedCreateWithoutWorkflowActionsInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutWorkflowActionsInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutWorkflowActionsInput, ItemUncheckedUpdateWithoutWorkflowActionsInput>
  }

  export type ItemUpdateWithoutWorkflowActionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneRequiredWithoutItemsNestedInput
    ebayAccount?: EbayAccountUpdateOneWithoutItemsNestedInput
    createdBy?: UserUpdateOneRequiredWithoutItemsCreatedNestedInput
    photos?: PhotoUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutWorkflowActionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    locationId?: StringFieldUpdateOperationsInput | string
    ebayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    photos?: PhotoUncheckedUpdateManyWithoutItemNestedInput
  }

  export type UserUpsertWithoutWorkflowActionsInput = {
    update: XOR<UserUpdateWithoutWorkflowActionsInput, UserUncheckedUpdateWithoutWorkflowActionsInput>
    create: XOR<UserCreateWithoutWorkflowActionsInput, UserUncheckedCreateWithoutWorkflowActionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutWorkflowActionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutWorkflowActionsInput, UserUncheckedUpdateWithoutWorkflowActionsInput>
  }

  export type UserUpdateWithoutWorkflowActionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneWithoutUsersNestedInput
    itemsCreated?: ItemUpdateManyWithoutCreatedByNestedInput
    sessions?: UserSessionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutWorkflowActionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    itemsCreated?: ItemUncheckedUpdateManyWithoutCreatedByNestedInput
    sessions?: UserSessionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyLocationInput = {
    id?: string
    email: string
    name: string
    role: $Enums.UserRole
    password: string
    lastActive?: Date | string | null
    isOnline?: boolean
    currentItemId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ItemCreateManyLocationInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    ebayAccountId?: string | null
    createdById: string
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EbayAccountCreateManyLocationInput = {
    id?: string
    accountName: string
    email: string
    appId: string
    certId: string
    devId: string
    authToken?: string | null
    refreshToken?: string | null
    sandbox?: boolean
    siteId?: number
    paypalEmail?: string | null
    postalCode?: string | null
    isActive?: boolean
    lastSync?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    itemsCreated?: ItemUpdateManyWithoutCreatedByNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutUserNestedInput
    sessions?: UserSessionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    itemsCreated?: ItemUncheckedUpdateManyWithoutCreatedByNestedInput
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutUserNestedInput
    sessions?: UserSessionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateManyWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    password?: StringFieldUpdateOperationsInput | string
    lastActive?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    isOnline?: BoolFieldUpdateOperationsInput | boolean
    currentItemId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ebayAccount?: EbayAccountUpdateOneWithoutItemsNestedInput
    createdBy?: UserUpdateOneRequiredWithoutItemsCreatedNestedInput
    photos?: PhotoUpdateManyWithoutItemNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    ebayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    photos?: PhotoUncheckedUpdateManyWithoutItemNestedInput
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateManyWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    ebayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    createdById?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EbayAccountUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ItemUpdateManyWithoutEbayAccountNestedInput
  }

  export type EbayAccountUncheckedUpdateWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ItemUncheckedUpdateManyWithoutEbayAccountNestedInput
  }

  export type EbayAccountUncheckedUpdateManyWithoutLocationInput = {
    id?: StringFieldUpdateOperationsInput | string
    accountName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    appId?: StringFieldUpdateOperationsInput | string
    certId?: StringFieldUpdateOperationsInput | string
    devId?: StringFieldUpdateOperationsInput | string
    authToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    sandbox?: BoolFieldUpdateOperationsInput | boolean
    siteId?: IntFieldUpdateOperationsInput | number
    paypalEmail?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    lastSync?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCreateManyEbayAccountInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    locationId: string
    createdById: string
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ItemUpdateWithoutEbayAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneRequiredWithoutItemsNestedInput
    createdBy?: UserUpdateOneRequiredWithoutItemsCreatedNestedInput
    photos?: PhotoUpdateManyWithoutItemNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutEbayAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    locationId?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    photos?: PhotoUncheckedUpdateManyWithoutItemNestedInput
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateManyWithoutEbayAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    locationId?: StringFieldUpdateOperationsInput | string
    createdById?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCreateManyCreatedByInput = {
    id?: string
    sku?: string | null
    stage?: $Enums.WorkflowStage
    status?: $Enums.ItemStatus
    locationId: string
    ebayAccountId?: string | null
    title?: string | null
    description?: string | null
    category?: string | null
    condition?: string | null
    brand?: string | null
    features?: ItemCreatefeaturesInput | string[]
    keywords?: ItemCreatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: number | null
    buyNowPrice?: number | null
    shippingCost?: number | null
    ebayId?: string | null
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkflowActionCreateManyUserInput = {
    id?: string
    itemId: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type UserSessionCreateManyUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type ItemUpdateWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    location?: LocationUpdateOneRequiredWithoutItemsNestedInput
    ebayAccount?: EbayAccountUpdateOneWithoutItemsNestedInput
    photos?: PhotoUpdateManyWithoutItemNestedInput
    workflowActions?: WorkflowActionUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    locationId?: StringFieldUpdateOperationsInput | string
    ebayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    photos?: PhotoUncheckedUpdateManyWithoutItemNestedInput
    workflowActions?: WorkflowActionUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateManyWithoutCreatedByInput = {
    id?: StringFieldUpdateOperationsInput | string
    sku?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    locationId?: StringFieldUpdateOperationsInput | string
    ebayAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    condition?: NullableStringFieldUpdateOperationsInput | string | null
    brand?: NullableStringFieldUpdateOperationsInput | string | null
    features?: ItemUpdatefeaturesInput | string[]
    keywords?: ItemUpdatekeywordsInput | string[]
    aiAnalysis?: NullableJsonNullValueInput | InputJsonValue
    startingPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    buyNowPrice?: NullableFloatFieldUpdateOperationsInput | number | null
    shippingCost?: NullableFloatFieldUpdateOperationsInput | number | null
    ebayId?: NullableStringFieldUpdateOperationsInput | string | null
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkflowActionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    item?: ItemUpdateOneRequiredWithoutWorkflowActionsNestedInput
  }

  export type WorkflowActionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkflowActionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserSessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PhotoCreateManyItemInput = {
    id?: string
    originalPath: string
    thumbnailPath?: string | null
    optimizedPath?: string | null
    isPrimary?: boolean
    order?: number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkflowActionCreateManyItemInput = {
    id?: string
    userId: string
    fromStage: $Enums.WorkflowStage
    toStage: $Enums.WorkflowStage
    action: string
    notes?: string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type PhotoUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    originalPath?: StringFieldUpdateOperationsInput | string
    thumbnailPath?: NullableStringFieldUpdateOperationsInput | string | null
    optimizedPath?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PhotoUncheckedUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    originalPath?: StringFieldUpdateOperationsInput | string
    thumbnailPath?: NullableStringFieldUpdateOperationsInput | string | null
    optimizedPath?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PhotoUncheckedUpdateManyWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    originalPath?: StringFieldUpdateOperationsInput | string
    thumbnailPath?: NullableStringFieldUpdateOperationsInput | string | null
    optimizedPath?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimary?: BoolFieldUpdateOperationsInput | boolean
    order?: IntFieldUpdateOperationsInput | number
    analysis?: NullableJsonNullValueInput | InputJsonValue
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkflowActionUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutWorkflowActionsNestedInput
  }

  export type WorkflowActionUncheckedUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkflowActionUncheckedUpdateManyWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    fromStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    toStage?: EnumWorkflowStageFieldUpdateOperationsInput | $Enums.WorkflowStage
    action?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    changes?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}