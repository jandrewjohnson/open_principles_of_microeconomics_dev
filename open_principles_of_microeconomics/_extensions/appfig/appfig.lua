-- _extensions/appfig/appfig.lua
--
-- Quarto shortcode for interactive textbook figures.
--
--   {{< appfig supply_shift_1 caption="Shifts in supply at $22,000" >}}
--
-- HTML output:  <a href="../apps/supply_shifts_textbook.html#v=1"><img src="../figures/supply_shift_1.png"></a>
-- PDF output:   the PNG as an ordinary figure
--
-- Both read figures.json, the sidecar that the pipeline writes from
-- figures.yml, so the state string lives in exactly one place.
--
-- Optional kwargs:
--   caption="..."   figure caption, also the alt text
--   live=true       lazy iframe of the ?embed URL instead of the click-through PNG
--   width="70%"     CSS width, default 100%
--
-- Paths are written relative to the document being rendered, using
-- quarto.project.offset, so a chapter in chapters/ links back up to the project
-- root. Do not hardcode "figures/" or "apps/" here.
--
-- This file is written into a book by `itp sync` from the installed
-- interactive_textbook_pipeline package. Edit it there, not in the book.

local manifest = nil
local SIDECAR = "figures.json"

-- Absolute path of the project root, whichever way this filter was invoked.
local function project_root()
  if quarto.project and quarto.project.directory then
    return quarto.project.directory
  end
  local env = os.getenv("QUARTO_PROJECT_DIR")
  if env then return env end
  return pandoc.system.get_working_directory()
end

-- Relative prefix from the current document back to the project root.
-- "" at the root, "../" for a chapter one level down.
local function root_prefix()
  local off = quarto.project and quarto.project.offset
  if off == nil then return "" end
  off = tostring(off):gsub("\\", "/")
  if off == "" or off == "." then return "" end
  return off .. "/"
end

local function load_manifest()
  if manifest then return manifest end
  local path = project_root():gsub("\\", "/") .. "/" .. SIDECAR
  local f = io.open(path, "r")
  if not f then
    error("appfig: " .. path .. " not found. Build with 'itp build <book>' or " ..
          "'itp sync <book>', which writes the sidecar from figures.yml.")
  end
  local txt = f:read("*a")
  f:close()
  manifest = quarto.json.decode(txt)
  if type(manifest) ~= "table" or type(manifest.figures) ~= "table" then
    error("appfig: " .. path .. " is not a figure manifest. Rebuild it with 'itp sync <book>'.")
  end
  return manifest
end

-- A kwarg Quarto did not receive arrives as an empty value, not nil, so an
-- 'or default' on the raw value never fires. Compare the stringified form.
local function kwarg(kwargs, name)
  local raw = kwargs[name]
  if raw == nil then return nil end
  local s = pandoc.utils.stringify(raw)
  if s == "" then return nil end
  return s
end

local function esc(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;"))
end

return {
  ["appfig"] = function(args, kwargs, meta)
    local m = load_manifest()
    local name = pandoc.utils.stringify(args[1])
    local fig = m.figures[name]
    if not fig then
      error("appfig: no figure named " .. name .. " in figures.yml")
    end

    local caption = kwarg(kwargs, "caption") or ""
    local live = (kwarg(kwargs, "live") or "false") == "true"
    local width = kwarg(kwargs, "width") or "100%"

    local prefix = root_prefix()
    local state = fig.state or "v=1"
    local png = prefix .. (m.out_dir or "figures") .. "/" .. name .. ".png"
    local app = prefix .. (m.apps_dir or "apps") .. "/" .. fig.app
    local app_url = app .. "#" .. state
    local embed_url = app .. "?embed#" .. state

    if quarto.doc.is_format("html") then
      -- The figure styles ship with the extension, so a book needs no styles.css.
      quarto.doc.add_html_dependency({
        name = "appfig",
        version = "0.2.0",
        stylesheets = {"appfig.css"},
      })
      local inner
      if live then
        inner = string.format(
          '<iframe src="%s" loading="lazy" style="width:%s;aspect-ratio:7/6;border:0" title="%s"></iframe>',
          esc(embed_url), esc(width), esc(caption))
      else
        inner = string.format(
          '<a href="%s" target="_blank" rel="noopener" class="appfig-link" title="Open interactive figure">' ..
          '<img src="%s" style="width:%s" alt="%s"></a>',
          esc(app_url), esc(png), esc(width), esc(caption))
      end
      local cap = caption ~= "" and ('<figcaption>' .. esc(caption) .. '</figcaption>') or ""
      return pandoc.RawBlock("html", '<figure class="appfig">' .. inner .. cap .. '</figure>')
    else
      -- PDF, docx, etc.: plain image
      local img = pandoc.Image({pandoc.Str(caption)}, png)
      return pandoc.Para({img})
    end
  end
}
