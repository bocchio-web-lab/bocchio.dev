import { Select as SelectPrimitive } from "bits-ui";

const Root = SelectPrimitive.Root;
const Group = SelectPrimitive.Group;
const Input = SelectPrimitive.Input;
const Label = SelectPrimitive.Label;
const Value = SelectPrimitive.Value;

import Content from "./select-content.svelte";
import Item from "./select-item.svelte";
import ItemIndicator from "./select-item-indicator.svelte";
import Trigger from "./select-trigger.svelte";
import Separator from "./select-separator.svelte";

export {
    Root,
    Group,
    Input,
    Label,
    Value,
    Content,
    Item,
    ItemIndicator,
    Trigger,
    Separator,
    //
    Root as Select,
    Content as SelectContent,
    Group as SelectGroup,
    Input as SelectInput,
    Item as SelectItem,
    ItemIndicator as SelectItemIndicator,
    Label as SelectLabel,
    Separator as SelectSeparator,
    Trigger as SelectTrigger,
    Value as SelectValue
};
