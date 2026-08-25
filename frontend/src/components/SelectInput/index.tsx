import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SelectProps,
} from "@mui/material";

interface Data {
  name: string | number;
  id: string | number;
}

type SelectInputProps = Omit<SelectProps, "form"> & {
  form: any;
  name: string;
  label: string;
  data: Data[] | undefined;
  helperText?: string;
};

function SelectInput({
  form,
  name,
  label,
  margin = "dense",
  size = "small",
  data,
  helperText,
  disabled,
  className,
  ...rest
}: SelectInputProps) {
  const isError = Boolean(form?.touched?.[name] && form?.errors?.[name]);
  const value = form?.values?.[name] ?? "";
  const labelId = `${name}-select-label`;

  const handleSelectChange = (event: SelectChangeEvent<unknown>) => {
    form?.setFieldValue(name, event.target.value);
  };

  return (
    <FormControl
      variant="outlined"
      margin={margin}
      size={size}
      fullWidth
      error={isError}
      disabled={disabled}
      className={className}
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={`${name}-select`}
        name={name}
        label={label}
        value={value}
        onChange={handleSelectChange}
        onBlur={form?.handleBlur}
        size={size}
        {...rest}
      >
        {data?.map((item) => (
          <MenuItem value={item.id} key={item.id}>
            {item.name}
          </MenuItem>
        ))}
      </Select>
      {(isError || helperText) && (
        <FormHelperText>
          {isError ? form.errors?.[name] : helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default SelectInput;

