import { useState } from "react"
import ApperIcon from "@/components/ApperIcon"
import Input from "@/components/atoms/Input"
import { cn } from "@/utils/cn"

const SearchBar = ({ 
  placeholder = "Search...", 
  onSearch, 
  className,
  debounceMs = 300 
}) => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (value) => {
    setSearchTerm(value)
    if (onSearch) {
      // Debounce search
      clearTimeout(window.searchTimeout)
      window.searchTimeout = setTimeout(() => {
        onSearch(value)
      }, debounceMs)
    }
  }

  return (
    <div className={cn("relative max-w-md", className)}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <ApperIcon name="Search" className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10"
      />
      {searchTerm && (
        <button
          onClick={() => handleSearch("")}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded p-0.5 transition-colors"
        >
          <ApperIcon name="X" className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </button>
      )}
    </div>
  )
}

export default SearchBar