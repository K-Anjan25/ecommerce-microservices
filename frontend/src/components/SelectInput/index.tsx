import { SelectProps, SelectChangeEvent } from "@mui/material";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

interface Data {
  name: string | number;
  id: string | number;
}
type SelectInputProps = SelectProps & {
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
  data,
  helperText,
}: SelectInputProps) {
  const isError = form.touched?.[name] && Boolean(form.errors?.[name]);

  const handleSelectChange = (event: SelectChangeEvent<string | number>) => {
    form.setFieldValue(name, event.target.value);
  };

  return (
    <>
      <FormControl variant="outlined" margin={margin} fullWidth error={isError}>
        <InputLabel>{label}</InputLabel>
        <Select
          name={name}
          label={label}
          value={form.values?.[name] ?? ""}
          onChange={handleSelectChange}
          onBlur={form.handleBlur}
        >
          {data?.map((item) => (
            <MenuItem value={item.id} key={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {isError ? form.errors?.[name] : helperText}
        </FormHelperText>
      </FormControl>
    </>
  );
}

export default SelectInput;
