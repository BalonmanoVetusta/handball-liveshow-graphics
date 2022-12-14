// Copied from https://github.com/Hoishin/use-nodecg/blob/master/src/use-replicant.ts
import { ReplicantOptions } from "nodecg/types/server";
import { useEffect, useState } from "react";
import structuredClone from "core-js-pure/actual/structured-clone";

/**
 * Subscribe to a replicant, returns tuple of the replicant value and `setValue` function.
 * The component using this function gets re-rendered when the value is updated.
 * The `setValue` function can be used to update replicant value.
 * @param replicantName The name of the replicant to use
 * @param initialValue Initial value to pass to `useState` function
 * @param options Options object.  Currently supports the optional `namespace` option
 */
export const useReplicant = <T, U>(
  replicantName: string,
  initialValue: U,
  options?: ReplicantOptions<T> & { namespace?: string }
): [T | U, (newValue: T) => void] => {
  const [value, setValue] = useState<T | U>(initialValue);

  const replicantOptions = options && {
    defaultValue: options.defaultValue,
    persistent: options.persistent,
    schemaPath: options.schemaPath,
  };
  const replicant =
    options && options.namespace
      ? nodecg.Replicant(replicantName, options.namespace, replicantOptions)
      : nodecg.Replicant(replicantName, replicantOptions);

  const changeHandler = (newValue: T): void => {
    setValue((oldValue) => {
      if (newValue !== oldValue) {
        return newValue;
      }
      // replicant.value has always the same reference. Cloning to cause re-rendering
      return structuredClone(newValue);
    });
  };

  useEffect(() => {
    if (replicant) {
      replicant.on("change", changeHandler);
    }

    return () => {
      if (replicant) {
        replicant.removeListener("change", changeHandler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replicant]);

  return [
    value,
    (newValue) => {
      replicant.value =
        typeof newValue === "function" ? newValue(replicant.value) : newValue;
    },
  ];
};
