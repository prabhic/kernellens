// ============================================
// READ SYSCALL CONFIGURATION
// ============================================
// Layer configurations for read() system call visualization

export const shapes = {
    circle: "M 280,80 m -20,0 a 20,20 0 1,0 40,0 a 20,20 0 1,0 -40,0",
    bars: "M 260,135 L 340,135 L 340,150 L 260,150 Z M 260,155 L 340,155 L 340,170 L 260,170 Z M 260,175 L 340,175 L 340,190 L 260,190 Z",
    tree: "M 250,200 L 350,200 L 350,250 L 250,250 Z M 255,210 L 265,210 L 265,220 L 255,220 Z M 255,230 L 345,230 L 345,240 L 255,240 Z",
    grid: "M 265,270 L 285,270 L 285,290 L 265,290 Z M 295,270 L 315,270 L 315,290 L 295,290 Z M 265,300 L 285,300 L 285,320 L 265,320 Z M 295,300 L 315,300 L 315,320 L 295,320 Z",
    queue: "M 240,340 L 360,340 L 360,380 L 240,380 Z M 250,350 L 270,350 L 270,370 L 250,370 Z M 280,350 L 300,350 L 300,370 L 280,370 Z M 310,350 L 330,350 L 330,370 L 310,370 Z",
    device: "M 250,410 L 350,410 L 350,450 L 250,450 Z M 270,420 L 280,420 L 280,430 L 270,430 Z M 320,420 L 330,420 L 330,430 L 320,430 Z"
};

export const layers = [
    {
        shape: 'circle',
        color: '#f093fb',
        y: 80,
        label: 'fd=3',
        tooltip: {
            title: 'User Space',
            desc: 'Application code requests file read with fd=3',
            code: 'read(fd, buffer, count)'
        }
    },
    {
        shape: 'bars',
        color: '#4facfe',
        y: 150,
        label: 'Registers',
        tooltip: {
            title: 'System Call Entry',
            desc: 'CPU switches to kernel mode via SYSCALL instruction',
            code: 'RAX=0 (syscall number)\nRDI=3 (fd)\nRSI=buffer_addr\nRDX=count'
        }
    },
    {
        shape: 'tree',
        color: '#43e97b',
        y: 215,
        label: 'file*',
        tooltip: {
            title: 'VFS Layer',
            desc: 'Virtual File System resolves fd to file structure',
            code: 'file* = current->files->fdt->fd[3];\npath = file->f_path;\ninode = file->f_inode;'
        }
    },
    {
        shape: 'grid',
        color: '#fa709a',
        y: 285,
        label: 'Blocks',
        tooltip: {
            title: 'Filesystem Layer',
            desc: 'ext4 maps file offset to physical blocks via extent tree',
            code: 'inode = ext4_iget(sb, 524288);\nextents = inode->i_block;\nblock = ext4_ext_find_extent()'
        }
    },
    {
        shape: 'queue',
        color: '#fee140',
        y: 355,
        label: 'Queue',
        tooltip: {
            title: 'Block I/O Layer',
            desc: 'Creates BIO request, submits to I/O scheduler queue',
            code: 'bio = bio_alloc(sector, count);\nbio->bi_end_io = end_bio_read;\nsubmit_bio(REQ_OP_READ, bio);'
        }
    },
    {
        shape: 'device',
        color: '#30cfd0',
        y: 425,
        label: 'Device',
        tooltip: {
            title: 'Device Driver',
            desc: 'Issues SCSI READ command, DMA transfers data to memory',
            code: 'scsi_read_10(device, lba, length);\nDMA: device_buffer -> kernel_buffer;\nIRQ on completion'
        }
    }
];

export const syscallName = 'read';
