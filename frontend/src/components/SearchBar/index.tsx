import React from "react";
import { Category } from "../../types/category";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import TuneIcon from "@mui/icons-material/Tune";

type SearchBarProps = {
  onChangeSearchValue: (value: string) => void;
  searchValue: string;
  onChangeSortBy: (value: string) => void;
  sortBy: string;
  onChangeFilter: (value: string) => void;
  filter: string;
  categories: Category[];
};

function SearchBar({
  onChangeSearchValue,
  searchValue,
  filter,
  onChangeFilter,
  onChangeSortBy,
  sortBy,
  categories,
}: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeSearchValue(e.target.value);
  };

  const handleChangeSortBy = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeSortBy(event.target.value);
  };

  const handleChangeFilter = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilter(event.target.value);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 md:flex-row">
      <div className="relative w-full flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <SearchIcon fontSize="small" />
        </div>
        <input
          type="search"
          className="input-control pl-10"
          placeholder="Search products..."
          value={searchValue}
          onChange={handleChange}
        />
      </div>
      
      <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
        <div className="relative w-full sm:w-48">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <SortIcon fontSize="small" />
          </div>
          <select
            className="input-control appearance-none pl-10"
            value={sortBy}
            onChange={handleChangeSortBy}
          >
            <option value="">Sort By</option>
            <option value="DATE_DESC">Date DESC</option>
            <option value="DATE_ASC">Date ASC</option>
            <option value="PRICE_DESC">Price DESC</option>
            <option value="PRICE_ASC">Price ASC</option>
          </select>
        </div>

        <div className="relative w-full sm:w-48">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <TuneIcon fontSize="small" />
          </div>
          <select
            className="input-control appearance-none pl-10"
            value={filter}
            onChange={handleChangeFilter}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
