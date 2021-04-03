import firebase from "firebase/app";

export const operatorMap = {
  $gt: ">",
  $gte: ">=",
  $eq: "==",
  $lt: "<",
  $lte: "<=",
  $in: "in",
  $elemMatch: "array-contains",
  ">": ">",
  ">=": ">=",
  "==": "==",
  "<": "<",
  "<=": "<=",
  in: "in",
  "array-contains": "array-contains",
  "array-contains-any": "array-contains-any",
};

export type operator = keyof typeof operatorMap;
export type filterFieldParams =
  | { [O in operator]?: string | number }
  | string
  | number;
export type filterParams = { [K in string]: filterFieldParams };
export type orderByParams = { field: string; order: "asc" | "desc" };

export type QueryParams = {
  filter?: filterParams;
  documentId?: filterFieldParams;
  limit?: number;
  limitToLast?: number;
  orderBy?: orderByParams[];
};

const deriveQueryForKey = <T>(
  query: firebase.firestore.Query<T>,
  {
    condition,
    key,
  }: {
    condition: filterFieldParams;
    key: firebase.firestore.FieldPath | string;
  }
) => {
  if (typeof condition === "object") {
    const operators = Object.keys(condition) as (keyof typeof condition)[];

    for (const operator of operators) {
      const firestoreOperator = operatorMap[operator];
      if (!firestoreOperator) {
        console.error("You cannot use this query in firestore", condition);
        continue;
      }
      query = query.where(
        key,
        firestoreOperator as firebase.firestore.WhereFilterOp,
        condition[operator]
      );
    }
  } else {
    query = query.where(key, "==", condition);
  }
  return query;
};

export const deriveQuery = <T>(
  query: firebase.firestore.Query<T>,
  queryParams?: QueryParams
): firebase.firestore.Query<T> => {
  if (!queryParams) {
    return query;
  }
  const { filter, documentId, limit, limitToLast, orderBy } = queryParams;
  if (filter) {
    for (const key of Object.keys(filter)) {
      query = deriveQueryForKey(query, {
        key,
        condition: filter[key],
      });
    }
  }
  if (documentId) {
    query = deriveQueryForKey(query, {
      key: firebase.firestore.FieldPath.documentId(),
      condition: documentId,
    });
  }
  if (orderBy) {
    for (const orderByItem of orderBy) {
      query = query.orderBy(orderByItem.field, orderByItem.order);
    }
  }
  if (typeof limit == "number") {
    query = query.limit(limit);
  }
  if (typeof limitToLast == "number") {
    query = query.limitToLast(limitToLast);
  }

  return query;
};
