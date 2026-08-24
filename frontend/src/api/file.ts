import { api } from "./client";

const saveFile = async (file: FormData): Promise<string> => {
  const { data } = await api.post<string>(
    `/file/saveImage`,
    file,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
};

const removeFile = async (imagePath: string): Promise<string> => {
  const { data } = await api.delete<string>(`/file/removeImage`, {
    params: { imagePath: imagePath },
  });
  return data;
};

export const FileApi = {
  saveFile,
  removeFile,
};
