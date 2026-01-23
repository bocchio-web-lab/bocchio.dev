import { Dialog as DialogPrimitive } from "bits-ui";

const Root = DialogPrimitive.Root;
const Trigger = DialogPrimitive.Trigger;
const Close = DialogPrimitive.Close;

import Portal from "./dialog-portal.svelte";
import Overlay from "./dialog-overlay.svelte";
import Content from "./dialog-content.svelte";
import Header from "./dialog-header.svelte";
import Footer from "./dialog-footer.svelte";
import Title from "./dialog-title.svelte";
import Description from "./dialog-description.svelte";

export {
    Root,
    Trigger,
    Close,
    Portal,
    Overlay,
    Content,
    Header,
    Footer,
    Title,
    Description,
    //
    Root as Dialog,
    Content as DialogContent,
    Description as DialogDescription,
    Footer as DialogFooter,
    Header as DialogHeader,
    Overlay as DialogOverlay,
    Portal as DialogPortal,
    Title as DialogTitle,
    Trigger as DialogTrigger,
    Close as DialogClose
};
