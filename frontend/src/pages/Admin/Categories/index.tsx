import { Box, Chip, Paper, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { CategoryApi } from "../../../api/categoryApi";
import EmptyState from "../../../components/EmptyState";
import PageHeader from "../../../components/PageHeader";
import SkeletonRows from "../../../components/SkeletonRows";
import { showSuccess } from "../../../utils/showSuccess";

function Categories() {
  const queryClient = useQueryClient();
  const [categoryName, setCategoryName] = useState("");

  const { data: categories, isLoading } = useQuery(
    ["admin-category:categories"],
    () => CategoryApi.getCategories()
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryName(e.target.value);
  };

  const addCategory = () => {
    if (categoryName.trim()) {
      createMutation.mutate({ name: categoryName.trim() });
    }
  };

  const createMutation = useMutation(CategoryApi.saveCategory, {
    onSuccess: () => {
      setCategoryName("");
      showSuccess("Category has been created successfully");
      queryClient.invalidateQueries("admin-category:categories");
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Organise products into browsable categories."
      />

      <Paper className="max-w-lg p-6">
        <Typography className="mb-3 font-semibold text-ink">
          Add a category
        </Typography>
        <Box className="flex gap-2">
          <TextField
            fullWidth
            size="small"
            label="Category name"
            value={categoryName}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <LoadingButton
            variant="contained"
            loading={createMutation.isLoading}
            disabled={!categoryName.trim()}
            className="!bg-brand !text-paper hover:!bg-brand-main"
            onClick={addCategory}
          >
            Add
          </LoadingButton>
        </Box>
      </Paper>

      {isLoading ? (
        <SkeletonRows rows={4} columns={3} />
      ) : categories?.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<CategoryOutlinedIcon fontSize="large" />}
            title="No categories yet"
            subtitle="Add your first category above to get started."
          />
        </div>
      ) : (
        <Box className="flex flex-wrap gap-3">
          {categories?.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              className="!border-ink/10 !bg-white !px-3 !py-5 !text-base !font-medium !text-ink shadow-card"
            />
          ))}
        </Box>
      )}
    </div>
  );
}

export default Categories;
