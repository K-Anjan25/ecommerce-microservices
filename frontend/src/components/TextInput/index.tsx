import React from "react";
import { TextField, TextFieldProps } from "@mui/material";

type TextInputProps = TextFieldProps & {
  form: any;
  name: string;
  label: string;
  [rest: string]: any;
};

/** Formik touched/errors are nested objects, so dotted names like
 *  `variants.0.name` must be resolved as paths, not flat keys. */
const getPath = (obj: any, path: string): any =>
  obj == null
    ? undefined
    : path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

function TextInput({
  form,
  name,
  label,
  margin = "dense",
  value,
  onChange,
  onBlur,
  helperText,
  ...rest
}: TextInputProps) {
  const error = Boolean(
    getPath(form.touched, name) && getPath(form.errors, name)
  );
  return (
    <TextField
      fullWidth
      name={name}
      label={label}
      margin={margin}
      value={value !== undefined ? value : getPath(form.values, name) ?? ""}
      onChange={onChange ?? form.handleChange}
      onBlur={onBlur ?? form.handleBlur}
      error={error}
      helperText={error ? getPath(form.errors, name) : helperText}
      {...rest}
    />
  );
}

export default TextInput;
